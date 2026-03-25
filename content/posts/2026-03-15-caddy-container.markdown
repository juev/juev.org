---
title: "Caddy в контейнере: как разделить публичные и приватные сервисы"
date: 2026-03-15T21:27:34+0300
tags:
  - caddy
  - podman
  - docker
  - tailscale
  - security
---

## Введение

Типичная self-hosted инфраструктура включает десятки сервисов: git-хостинг, мониторинг, RSS-ридер, менеджер паролей, заметки. Часть из них должна быть доступна из интернета, часть — только из приватной сети (VPN/mesh). Caddy[^1] — удобный reverse proxy с автоматическим TLS — отлично справляется с маршрутизацией и терминацией HTTPS для всех этих сервисов.

Проблема возникает, когда Caddy работает в контейнере (Docker, Podman) и нужно разделить доступ: публичные сервисы для всех, приватные — только для клиентов из VPN-сети. Казалось бы, достаточно проверить IP-адрес клиента через matcher `remote_ip`. Но контейнерная сеть вносит свои коррективы.

В этой статье я разберу проблему потери client IP в контейнеризированном Caddy, рассмотрю девять вариантов решения, подробно сравню два лучших и покажу реализацию выбранного подхода.

## Проблема: потеря client IP в контейнере

Caddy работает в rootless Podman контейнере на custom bridge network. Все входящие TCP-соединения проходят через pasta port forwarder, который выполняет SNAT (Source NAT). В результате Caddy видит IP шлюза внутренней сети, а не реальный IP клиента[^2]:

```text
Клиент (203.0.113.50) -> хост:443 -> pasta port forwarder -> bridge network
-> SNAT -> Caddy (видит remote_ip = 10.89.0.1)
```

Это делает невозможным:

- Фильтрацию по `remote_ip` для ограничения доступа к приватным сервисам
- Корректное логирование IP клиентов
- Использование `trusted_proxies` / `X-Forwarded-For` — IP потерян на TCP-уровне, до HTTP[^3]

Custom bridge network необходима для inter-container DNS — Caddy обращается к backend-сервисам по имени контейнера (`forgejo:3000`, `grafana:3000`). Без неё пришлось бы публиковать порты каждого backend-а и обращаться через `host.containers.internal`, что ненадёжно и неудобно.

Проблема специфична для rootless-контейнеров с custom network. Вот как ведут себя разные сетевые режимы:

| Метод сети | Source IP | Inter-container DNS |
| --- | --- | --- |
| Socket activation (systemd) | сохраняется | да (custom network) |
| Pasta (без custom network) | сохраняется | нет |
| Pasta + custom network | **теряется** | да |
| Host network | сохраняется | нет |

Источник: [podman-networking-docs](https://github.com/eriksjolund/podman-networking-docs)[^4].

## Почему фильтрация только по IP недостаточна

Даже если бы `remote_ip` работал в контейнере, фильтрация только на уровне IP-адреса — не лучший подход к безопасности:

**DNS не является средством контроля доступа.** Вариант «приватные домены резолвятся только в VPN» (Split DNS) не защищает от прямого обращения по IP или от утечки DNS-записей. IP сервера известен, порты открыты — злоумышленник может отправить запрос с правильным заголовком `Host` напрямую.

**Caddy ответит на любой запрос с валидным SNI.** Если в Caddyfile есть site block для `grafana.example.org`, Caddy обработает запрос на этот домен независимо от того, откуда пришёл клиент (при условии, что `remote_ip` matcher не работает из-за SNAT). Ошибка в конфигурации `remote_ip` — и приватный сервис открыт в интернет.

**Нужна физическая или сетевая изоляция.** Надёжный подход — вынести приватные сервисы на отдельный сетевой интерфейс, порты которого не опубликованы в интернет. Тогда даже при ошибке конфигурации приватный трафик физически не может прийти извне.

## Варианты решения

В ходе исследования рассмотрено девять вариантов. Вот краткая сводка:

| Вариант | Source IP | Изоляция | Inter-container | Подходит |
| --- | --- | --- | --- | --- |
| **1. Socket activation** | да | логическая | да | **да** |
| 2. Caddy на хосте | да | нет (Caddy) | через порты | частично |
| **3. Два Caddy** | публ: нет, TS: да | физическая | да | **да** |
| 4. caddy-tailscale плагин | только TS | да | да | частично |
| 5. Tailscale sidecar (Caddy) | только TS | да | нет | частично |
| 6. Pasta без custom net | да (внешние) | да | нет | нет |
| 7. Host network | ограничено | нет | нет | нет |
| 8. Tailscale sidecar (backend) | через ACL | да | нет | нет |
| 9. Split DNS | не решает | не меняет | не меняет | дополнение |

Варианты 2, 6, 7 ломают inter-container DNS. Вариант 4 (caddy-tailscale) экспериментальный и не решает проблему для публичного трафика. Вариант 8 требует sidecar на каждый сервис — +10-20 MB RAM и сложное управление при 20+ сервисах. Вариант 9 (Split DNS) — дополнение, а не решение.

Два варианта прошли в финал: **socket activation** и **два Caddy с Tailscale sidecar**.

## Два финалиста

### Почему именно эти два

**Socket activation** — рекомендация, основанная на минимальности изменений. Один Caddy, одна конфигурация, source IP сохраняется для всего трафика. Проверенный production-паттерн с документированными примерами[^5][^6].

**Два Caddy** — альтернатива, выбранная из-за физической изоляции. Приватные порты не опубликованы — ошибка в Caddyfile не приведёт к утечке. Defense in depth: даже при компрометации публичного Caddy приватные сервисы недоступны.

## Socket activation

### Как это работает

systemd создаёт сокеты на портах 80/443 на хосте через `.socket` unit. При входящем соединении file descriptors передаются в контейнер. Caddy получает TCP-соединения с реальным client IP, минуя pasta port forwarder. При этом Caddy остаётся на custom network для связи с backend-ами[^5][^6]:

```text
Без socket activation:
  Клиент (203.0.113.50) -> хост:443 -> pasta -> SNAT -> Caddy (видит 10.89.0.1)

С socket activation:
  Клиент (203.0.113.50) -> хост:443 -> systemd socket -> fd/4 -> Caddy (видит 203.0.113.50)
  Caddy -> custom network -> backend-контейнеры (по имени)
```

### Конфигурация

**Socket unit** (`caddy.socket`):

```ini
[Socket]
BindIPv6Only=both
ListenStream=[::]:80    # fd/3
ListenStream=[::]:443   # fd/4
ListenDatagram=[::]:443 # fd/5 (QUIC/HTTP3)

[Install]
WantedBy=sockets.target
```

**Caddyfile** с fd-binding:

```caddyfile
{
    auto_https disable_redirects
    default_bind fd/4 { protocols h1 h2 }
    default_bind fdgram/5 { protocols h3 }
    admin unix//run/admin.sock
    acme_dns cloudflare {env.CLOUDFLARE_API_TOKEN}
}

http:// {
    bind fd/3
    redir https://{host}{uri} permanent
}

(private) {
    @not_vpn not remote_ip 100.64.0.0/10
    respond @not_vpn "Forbidden" 403
}

git.example.org {
    reverse_proxy forgejo:3000
}

grafana.example.org {
    import private
    reverse_proxy grafana:3000
}
```

### Плюсы

- Source IP сохраняется для **всего** трафика — и публичного, и VPN
- Один Caddy, один Caddyfile, один набор сертификатов
- Нативная производительность сети
- Backend-сервисы без изменений
- Проверенный паттерн с Quadlet-примерами[^5][^6]

### Минусы

- `auto_https` не работает — нужен явный HTTP->HTTPS redirect
- `systemctl reload` не работает — reload только через `podman exec`[^7]
- Нумерация fd хрупкая — при нескольких `.socket` файлах порядок не гарантирован[^8]
- Изоляция **логическая** — ошибка в matcher `remote_ip` откроет приватный сервис

## Два Caddy с Tailscale sidecar

### Как это работает

Публичный Caddy обслуживает интернет-сервисы через `PublishPort`. Приватный Caddy делит network namespace с Tailscale sidecar-контейнером — видит интерфейс `tailscale0` и получает реальные VPN IP клиентов. Приватные порты не опубликованы — доступ только через VPN[^9][^10]:

```text
Интернет -> PublishPort -> Caddy-public (IP потерян, но не нужен)
    -> git, reader, vault, id

VPN (100.64.0.X) -> WireGuard -> tailscale0 -> Caddy-private (видит реальный VPN IP)
    -> grafana, prometheus, notes, search
```

### Ключевая деталь: shared namespace + bridge network

Tailscale sidecar подключён к custom bridge network. Caddy-private разделяет его network namespace (`Network=tailscale-sidecar.container`). Это означает, что Caddy-private видит **одновременно**:

- bridge-интерфейс на custom network (inter-container DNS к backend-ам)
- `tailscale0` (реальные VPN IP клиентов)

Shared namespace и bridge network не взаимоисключающие — sidecar наследует оба интерфейса.

### Конфигурация

**Tailscale sidecar** (`tailscale-sidecar.container`):

```ini
[Container]
ContainerName=tailscale-sidecar
Image=docker.io/tailscale/tailscale:latest
Network=app.network
AddCapability=NET_ADMIN
AddDevice=/dev/net/tun
Environment=TS_STATE_DIR=/var/lib/tailscale
Environment=TS_HOSTNAME=server-private
Environment=TS_EXTRA_ARGS=--login-server=https://vpn.example.org
Environment=TS_NETFILTER_MODE=off
Environment=TS_USERSPACE=false
Volume=tailscale_state:/var/lib/tailscale:Z

[Service]
Restart=always

[Install]
WantedBy=default.target
```

`TS_USERSPACE=false` — принудительно использовать TUN-режим. Без этого `containerboot` может выбрать userspace networking, и интерфейс `tailscale0` не появится. `TS_NETFILTER_MODE=off` подавляет ошибки iptables в rootless-контейнере — они cosmetic и не влияют на работу WireGuard.

**Caddy-private** (`caddy-private.container`):

```ini
[Unit]
After=tailscale-sidecar.service
Requires=tailscale-sidecar.service

[Container]
ContainerName=caddy-private
Image=caddy:2
Exec=caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
Network=tailscale-sidecar.container
Environment=CLOUDFLARE_API_TOKEN=<token>
Volume=./Caddyfile-private:/etc/caddy/Caddyfile:ro,Z
Volume=caddy_private_data:/data:Z
Volume=caddy_private_config:/config:Z

[Service]
Restart=always

[Install]
WantedBy=default.target
```

**Caddyfile-private**:

```caddyfile
{
    acme_dns cloudflare {env.CLOUDFLARE_API_TOKEN}
}

grafana.example.org {
    reverse_proxy grafana:3000
}

prometheus.example.org {
    reverse_proxy prometheus:9090
}

notes.example.org {
    reverse_proxy silverbullet:3000
}
```

### NET_ADMIN в rootless Podman

Для TUN-интерфейса Tailscale нужен `NET_ADMIN` и `/dev/net/tun`. Практическая проверка показала, что в rootless Podman 5.x на Debian 13 TUN создаётся успешно:

```text
$ podman exec tailscale-sidecar ip link show tailscale0
3: tailscale0: <POINTOPOINT,MULTICAST,NOARP,UP,LOWER_UP> mtu 1280
    link/none
```

iptables выдаёт `Permission denied` — rootless-контейнер не может управлять firewall хоста. Это не критично: WireGuard-туннель работает, firewall управляется на уровне хоста.

### Плюсы

- **Физическая изоляция** — приватные порты не опубликованы; ошибка в Caddyfile не откроет сервис в интернет
- `auto_https`, `reload` — работают стандартно, без костылей
- Два простых Caddyfile вместо одного сложного
- Независимые обновления публичного и приватного Caddy
- Defense in depth — компрометация публичного Caddy не затрагивает приватные сервисы

### Минусы

- Три контейнера вместо одного (Caddy-public + Tailscale sidecar + Caddy-private)
- Два набора TLS-сертификатов
- +30-50 MB RAM (Tailscale + второй Caddy)
- Дополнительная нода в VPN-координаторе

## Сравнение вариантов

| Критерий | Socket activation | Два Caddy |
| --- | --- | --- |
| Компоненты | 1 Caddy + .socket | 2 Caddy + 1 sidecar |
| Source IP (публичный) | виден | потерян (не нужен) |
| Source IP (VPN) | виден | виден |
| Inter-container DNS | работает | работает |
| Caddyfile | 1 файл, все site blocks | 2 файла, проще каждый |
| TLS-сертификаты | 1 набор | 2 набора |
| Изоляция приватных | логическая (remote_ip 403) | **физическая** (порты не опубликованы) |
| auto_https | отключен | работает |
| Reload | только podman exec | стандартный |
| RAM overhead | ~0 | +30-50 MB |
| Дополнительная VPN-нода | нет | да |
| Сложность конфигурации | средняя (fd-binding) | средняя (shared namespace) |
| Риск ошибки конфигурации | приватный сервис открыт | приватный сервис недоступен |
| Независимые обновления | нет | да |
| Мониторинг | 1 процесс | 3 процесса |

## Реализация: переход на два Caddy

Последовательность действий при переходе на архитектуру с двумя Caddy:

### 1. Tailscale sidecar

Создать контейнер с Tailscale, подключённый к общей сети backend-ов. Сгенерировать auth key в VPN-координаторе, запустить sidecar, убедиться что `tailscale0` создан и нода зарегистрирована. Записать VPN IP новой ноды — он понадобится для DNS.

### 2. Caddy-private

Создать второй Caddy с `Network=tailscale-sidecar.container`. Важно: если образ Caddy содержит caddy-docker-proxy или аналогичный плагин, нужно явно переопределить команду на `caddy run --config /etc/caddy/Caddyfile --adapter caddyfile` — иначе контейнер упадёт с ошибкой подключения к Docker socket.

### 3. Caddyfile-private

Отдельный Caddyfile с site blocks только для приватных сервисов. TLS через DNS challenge (тот же подход, что у публичного Caddy). Backend-ы доступны по имени контейнера — inter-container DNS работает через shared namespace.

### 4. Обновить публичный Caddy

Удалить site blocks приватных сервисов из основного Caddyfile. Публичный Caddy обслуживает только интернет-сервисы. Docker-proxy и связанные переменные окружения можно убрать, если они больше не нужны.

### 5. DNS

Обновить DNS-записи приватных доменов — A и AAAA записи должны указывать на VPN IP sidecar-ноды, не на публичный IP сервера. Записи видны публично, но VPN IP не маршрутизируется в интернете. Не забыть про **AAAA-записи** — если IPv6 указывает на старый адрес, клиенты с IPv6 получат SSL-ошибку (попадут на публичный Caddy, где приватного домена уже нет).

### 6. Проверка

- Публичные сервисы доступны из интернета
- Приватные сервисы доступны из VPN
- Приватные сервисы **не** доступны из интернета (VPN IP не маршрутизируется)
- SSH-проксирование (Layer4) работает на публичном Caddy

## Итоги

Контейнеризация Caddy создаёт неочевидную проблему: custom bridge network, необходимая для inter-container DNS, убивает видимость client IP через SNAT. Matcher `remote_ip` перестаёт работать, и разделить публичные и приватные сервисы средствами Caddy становится невозможно.

Из девяти рассмотренных вариантов два оказались практичными:

**Socket activation** — элегантное решение для тех, кто ценит минимализм. Один Caddy, один Caddyfile, source IP для всего трафика. Цена — отключённый `auto_https`, reload через `podman exec`, логическая изоляция через matcher.

**Два Caddy с Tailscale sidecar** — решение для тех, кто ценит безопасность. Физическая изоляция: приватные порты не опубликованы, ошибка конфигурации не приведёт к утечке. Цена — три контейнера, два набора сертификатов, дополнительная VPN-нода.

Выбор зависит от приоритетов. Если главное — простота и полный контроль над IP — socket activation. Если главное — гарантия изоляции и defense in depth — два Caddy. Оба варианта совместимы с rootless Podman, custom bridge network и существующей инфраструктурой backend-сервисов.

## Источники

[^1]: [Caddy — официальный сайт](https://caddyserver.com/)

[^2]: [Caddy Community — How to get true remote IP behind reverse proxy](https://caddy.community/t/how-to-get-a-true-remote-ip-behind-caddy-reverse-proxy/22348/2)

[^3]: [Caddy GitHub Issue #6257 — Getting real IP on Docker](https://github.com/caddyserver/caddy/issues/6257)

[^4]: [eriksjolund/podman-networking-docs — Rootless Podman networking](https://github.com/eriksjolund/podman-networking-docs)

[^5]: [Caddy Community — Demo: socket activation + rootless Podman + Quadlet](https://caddy.community/t/demo-run-caddy-with-socket-activation-rootless-podman-quadlet-files/25918)

[^6]: [eriksjolund/podman-caddy-socket-activation — GitHub](https://github.com/eriksjolund/podman-caddy-socket-activation)

[^7]: [Caddy GitHub Issue #6631 — systemctl reload fails with dial fd](https://github.com/caddyserver/caddy/issues/6631)

[^8]: [Caddy GitHub Issue #6792 — Socket activation with multiple .socket files](https://github.com/caddyserver/caddy/issues/6792)

[^9]: [Tailscale Blog — Docker Tailscale Guide (sidecar pattern)](https://tailscale.com/blog/docker-tailscale-guide)

[^10]: [http403/tailscale-caddy — Serving Caddy with Tailscale sidecar](https://github.com/http403/tailscale-caddy)
