---
title: "Self-hosted Tailscale: веб-интерфейс и вход без паролей"
date: 2026-03-13T14:26:02+0300
tags:
  - headscale
  - headplane
  - tailscale
  - oidc
  - passkey
  - caddy
  - docker
---

Tailscale решает одну из самых неприятных проблем в администрировании — построение защищённой сети между разрозненными устройствами. WireGuard-шифрование, NAT traversal, mesh-топология — всё работает из коробки. Но координационный сервер Tailscale — проприетарный.

Headscale позволяет запустить его самостоятельно. Только вот управление остаётся в терминале: создание пользователей, регистрация нод, настройка ACL (Access Control List) — всё через CLI. В этой статье я расскажу, как превратить Headscale в полноценную платформу с веб-интерфейсом и единой аутентификацией через passkey, используя Headplane и Pocket ID.

**Кратко:** Headscale + Headplane + Pocket ID + Caddy дают self-hosted Tailscale с веб-админкой и регистрацией устройств через passkey (без паролей). Развёртывание — 4 Docker-контейнера, ~30 минут на настройку.

**Версии:** Headscale 0.28, Headplane 0.6.2, Pocket ID v2.3.0 (проверено март 2026).

**Требования:** Docker (или Podman), два домена с A-записями на IP сервера (`scale.example.org`, `id.example.org`), ~512 MB RAM, базовое знакомство с Docker Compose.

**Оглавление:**

- [Tailscale: зачем нужна частная сеть](#tailscale-зачем-нужна-частная-сеть)
- [Headscale: собственный координационный сервер](#headscale-собственный-координационный-сервер)
- [Headplane: веб-интерфейс для Headscale](#headplane-веб-интерфейс-для-headscale)
- [Pocket ID: простая аутентификация через passkey](#pocket-id-простая-аутентификация-через-passkey)
- [Развёртывание](#развёртывание)
- [Интеграция: как всё связать](#интеграция-как-всё-связать)
- [Результат: сеть без консоли](#результат-сеть-без-консоли)
- [Подводные камни](#подводные-камни)
- [Устранение неполадок](#устранение-неполадок)
- [Часто задаваемые вопросы](#часто-задаваемые-вопросы)
- [Безопасность](#безопасность)

## Tailscale: зачем нужна частная сеть

Tailscale[^1] — mesh VPN на базе WireGuard. Он создаёт защищённую сеть (tailnet) между устройствами, где каждое устройство получает стабильный IP-адрес из диапазона `100.64.0.0/10`. Подключение peer-to-peer: трафик идёт напрямую между устройствами, а не через центральный сервер.

Что это даёт на практике:

- **Доступ к домашним сервисам откуда угодно.** NAS, мониторинг, git-сервер — всё доступно по стабильным IP без проброса портов и динамического DNS
- **Безопасность.** WireGuard шифрует весь трафик между узлами. Сервисы не нужно выставлять в публичный интернет
- **NAT traversal.** Tailscale пробивает NAT автоматически — устройства находят друг друга даже за несколькими слоями NAT
- **Кроссплатформенность.** Клиенты для Linux, macOS, Windows, iOS, Android

Но у облачного Tailscale есть ограничения:

- **Координационный сервер — у Tailscale Inc.** Ключи, маршруты, списки устройств хранятся на их серверах. Для личной инфраструктуры это может быть неприемлемо
- **Лимиты бесплатного плана.** Ограничение на количество устройств и пользователей
- **Зависимость от сервиса.** Если Tailscale Inc. изменит условия, поднимет цены или прекратит работу — сеть перестанет функционировать
- **Лицензия клиентов.** С 2024 года клиенты Tailscale распространяются под BSL (Business Source License), а не MIT[^2]

## Headscale: собственный координационный сервер

Headscale[^3] — open-source реализация координационного сервера Tailscale. Один бинарник на Go, SQLite для хранения состояния, совместимость с официальными клиентами Tailscale. Проект зрелый: 36 000+ звёзд на GitHub, активная разработка, один из мейнтейнеров работает в Tailscale Inc. и координирует совместимость протоколов[^4].

Headscale решает главные проблемы облачного Tailscale:

- **Полный контроль.** Ключи, маршруты, ACL — всё на вашем сервере
- **Нет лимитов.** Количество устройств и пользователей не ограничено
- **Приватность.** Метаданные сети не покидают вашу инфраструктуру
- **Независимость.** Работает автономно, не зависит от доступности внешних сервисов

Но за контроль приходится платить:

- **Управление только через CLI.** Нет встроенного веб-интерфейса. Создание пользователей, регистрация нод, просмотр маршрутов — всё в терминале
- **Регистрация нод требует участия администратора.** Без OIDC каждое новое устройство регистрируется через pre-auth ключ или одобряется вручную из консоли сервера
- **Нет визуализации.** Состояние сети — это вывод `headscale nodes list` в терминале. Нет карты сети, нет удобного просмотра маршрутов и ACL
- **Конфигурация ACL через JSON-файл.** Редактирование политик доступа — ручная правка JSON и перезагрузка сервера

Типичный рабочий процесс с Headscale выглядит так:

```bash
# Создание пользователя
headscale users create alice

# Генерация pre-auth ключа
headscale preauthkeys create --user alice --reusable --expiration 1h

# На клиентском устройстве
tailscale up --login-server https://scale.example.org --authkey <KEY>

# Просмотр узлов
headscale nodes list

# Управление маршрутами
headscale routes list
headscale routes enable -r 1
```

Для одного администратора с парой серверов это терпимо. Но когда устройств становится больше десятка, а за сеть отвечают несколько человек — необходимость SSH-доступа к серверу для каждой операции становится узким местом.

## Headplane: веб-интерфейс для Headscale

Для Headscale существует несколько community-проектов веб-интерфейса. Headscale-UI[^5] — минималистичный SPA, который взаимодействует с Headscale через API. Headplane[^6] — более функциональный вариант, который позиционируется как «feature-complete Web UI for Headscale» и активно развивается. Других зрелых альтернатив на момент написания нет.

Я выбрал Headplane по нескольким причинам:

- **Управление узлами.** Просмотр, переименование, удаление, перемещение между пользователями drag-and-drop
- **Редактор ACL.** Визуальный редактор политик доступа прямо в браузере
- **DNS-управление.** Настройка MagicDNS, split DNS, extra-записей через UI
- **Управление пользователями.** Создание, переименование, удаление пользователей, назначение ролей
- **Управление маршрутами.** Просмотр и одобрение subnet routes и exit nodes
- **Поддержка OIDC.** Аутентификация администраторов через OpenID Connect
- **Активная разработка.** Текущая версия — 0.6.2 (февраль 2026), совместимость с Headscale 0.28[^7]

Однако у Headplane без OIDC-интеграции есть существенное ограничение. Для взаимодействия с Headscale ему нужен API-ключ. Ключ генерируется из консоли:

```bash
headscale apikeys create --expiration 90d
```

Этот ключ передаётся в конфигурацию Headplane как `ROOT_API_KEY`. Ключ имеет срок действия — его нужно периодически обновлять вручную. Headplane снимает часть нагрузки с CLI, но не решает проблему полностью: регистрация новых устройств по-прежнему требует генерации pre-auth ключей из консоли или через API.

## Pocket ID: простая аутентификация через passkey

Для полноценной работы связки не хватает одного компонента — аутентификации. Headplane поддерживает OIDC (OpenID Connect — протокол единого входа поверх OAuth 2.0), и Headscale тоже. Нужен OIDC-провайдер.

Существуют мощные решения: Keycloak[^8], Authentik[^9], Zitadel[^10]. Но для личной инфраструктуры с одним-двумя пользователями они избыточны. Keycloak — Java-приложение, потребляющее сотни мегабайт RAM. Authentik и Zitadel проще, но всё равно требуют настройки пользовательских баз, политик паролей и MFA.

Pocket ID[^11] решает задачу иначе. Это минималистичный OIDC-провайдер, построенный вокруг одной идеи: **аутентификация только через passkey**. Никаких паролей, никакой настройки MFA — passkey уже является вторым фактором (биометрия или PIN устройства). Проект написан на Go, потребляет минимум ресурсов, развёртывается одним контейнером.

Что даёт Pocket ID:

- **Passkey-first.** Вход через биометрию (Touch ID, Face ID, Windows Hello) или аппаратный ключ (YubiKey). Пароли не используются и не хранятся. Важно: WebAuthn требует HTTPS — Pocket ID не будет работать по HTTP
- **OIDC-совместимость.** Стандартный OpenID Connect — работает с любым сервисом, поддерживающим OIDC
- **Простота.** Веб-интерфейс для управления клиентами и пользователями. Минимальная конфигурация
- **PKCE.** Поддержка Proof Key for Code Exchange (S256) — дополнительная защита при обмене authorization code[^12]
- **Группы пользователей.** Ограничение доступа к OIDC-клиентам по группам
- **LDAP.** Опциональная поддержка LDAP для интеграции с legacy-сервисами[^11]

Текущая версия — v2.3.0 (март 2026), 7 100+ звёзд на GitHub[^13].

Развёртывание Pocket ID — один контейнер с единственной переменной окружения `APP_URL`. После первого запуска интерфейс предложит создать администратора и зарегистрировать passkey. Все последующие входы — через passkey, без пароля. Подробности — в следующем разделе.

## Развёртывание

Все четыре компонента — Caddy, Headscale, Headplane, Pocket ID — запускаются как контейнеры. Ниже — полная конфигурация для Docker Compose. Для Podman файлы совместимы через `podman-compose` или конвертируются в Quadlet-формат[^14].

### Структура директорий

```text
├── docker-compose.yml
├── .env
├── caddy/
│   └── Caddyfile
├── headscale/
│   └── config.yaml
├── headplane/
│   └── config.yaml
└── pocket-id/
    └── data/
```

### Docker Compose

```yaml
services:
  caddy:
    image: caddy:2
    container_name: caddy
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./caddy/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - frontend

  headscale:
    image: ghcr.io/juanfont/headscale:0.28.0
    container_name: headscale
    restart: always
    command: serve
    labels:
      me.tale.headplane.target: headscale
    ports:
      - "3478:3478/udp"
    volumes:
      - ./headscale/config.yaml:/etc/headscale/config.yaml:ro
      - headscale_data:/var/lib/headscale
    networks:
      - frontend

  headplane:
    image: ghcr.io/tale/headplane:0.6.2
    container_name: headplane
    restart: always
    environment:
      ROOT_API_KEY: "${HEADPLANE_API_KEY}"
      COOKIE_SECRET: "${HEADPLANE_COOKIE_SECRET}"
    volumes:
      - ./headplane/config.yaml:/etc/headplane/config.yaml:ro
      - ./headscale/config.yaml:/etc/headscale/config.yaml
      - headplane_data:/var/lib/headplane
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - frontend

  pocket-id:
    image: ghcr.io/pocket-id/pocket-id:v2.3.0
    container_name: pocket-id
    restart: always
    environment:
      APP_URL: https://id.example.org
    volumes:
      - ./pocket-id/data:/app/backend/data
    networks:
      - frontend

networks:
  frontend:

volumes:
  caddy_data:
  caddy_config:
  headscale_data:
  headplane_data:
```

Порт `3478/udp` — STUN для NAT traversal. Порты `80` и `443` — только у Caddy. Остальные сервисы общаются через внутреннюю сеть `frontend` по именам контейнеров.

Label `me.tale.headplane.target` на контейнере Headscale позволяет Headplane находить его через Docker API и отправлять сигнал перезапуска при изменении DNS-настроек[^19]. Headplane также монтирует конфиг Headscale (без `:ro` — для записи изменений) и Docker-сокет (для обнаружения и перезапуска контейнера).

Секреты вынесены в `.env` файл, который не коммитится в репозиторий (добавьте `.env` в `.gitignore`):

```bash
# .env
HEADPLANE_API_KEY=<будет сгенерирован после первого запуска>
HEADPLANE_COOKIE_SECRET=<32 символа, см. ниже>
```

### Caddyfile

```caddyfile
scale.example.org {
    # Headplane ожидает запросы с /admin — используем path, а не handle_path.
    # handle_path стрипает префикс, и Headplane не найдёт свои маршруты.
    @admin path /admin /admin/*
    reverse_proxy @admin headplane:3000

    # stream_close_delay предотвращает разрыв streaming-соединений
    # Tailscale-клиентов при graceful reload Caddyfile.
    reverse_proxy headscale:8080 {
        stream_close_delay 5s
    }
}

id.example.org {
    reverse_proxy pocket-id:80
}
```

Caddy автоматически получит TLS-сертификаты для обоих доменов через Let's Encrypt[^15]. Оба домена должны иметь A-записи, указывающие на IP сервера.

`@admin` — именованный matcher[^16]: запросы к `/admin` уходят на Headplane, всё остальное — на Headscale. Caddy нативно поддерживает WebSocket[^17], что критично для протокола Tailscale — координация между клиентом и сервером использует long-polling через WebSocket.

Если Headscale использует встроенный DERP-сервер, STUN-порт (UDP/3478) публикуется отдельно — он не проксируется через Caddy[^17].

### Headscale config.yaml

Базовая конфигурация без OIDC — OIDC добавляется на этапе интеграции:

```yaml
server_url: https://scale.example.org
listen_addr: 0.0.0.0:8080
metrics_listen_addr: 0.0.0.0:9090

# TLS отключён — терминация на уровне Caddy
tls_cert_path: ""
tls_key_path: ""

noise:
  private_key_path: /var/lib/headscale/noise_private.key

database:
  type: sqlite
  sqlite:
    path: /var/lib/headscale/db.sqlite
    write_ahead_log: true

prefixes:
  v4: 100.64.0.0/10
  v6: fd7a:115c:a1e0::/48

derp:
  server:
    enabled: false
  urls:
    - https://controlplane.tailscale.com/derpmap/default
  auto_update_enabled: true
  update_frequency: 3h
```

Ключ `noise_private.key` генерируется автоматически при первом запуске[^3]. При миграции с существующего Headscale этот файл нужно перенести — без него все клиенты потеряют связь с сервером.

Встроенный DERP-сервер (DERP — Designated Encrypted Relay for Peers, relay для устройств, которые не могут установить прямое соединение) отключён для простоты. Headscale будет использовать публичные DERP-серверы Tailscale. Для продакшена можно включить собственный DERP — это уменьшит задержки при relay-соединениях[^17]. Полный список параметров — в официальной документации[^18].

### Headplane config.yaml

```yaml
headscale:
  url: http://headscale:8080
  config_path: /etc/headscale/config.yaml

integration:
  docker:
    enabled: true
```

Параметр `config_path` указывает путь к конфигу Headscale внутри контейнера Headplane — через него Headplane читает и записывает DNS-настройки. Секция `integration.docker` включает обнаружение контейнера Headscale по label и его перезапуск после изменения конфигурации.

Headplane подключается к Headscale по внутренней сети Docker. Два секрета передаются через переменные окружения:

- `ROOT_API_KEY` — ключ доступа к Headscale API
- `COOKIE_SECRET` — ключ шифрования сессионных cookies, ровно 32 символа

Генерация `COOKIE_SECRET`:

```bash
openssl rand -base64 24
```

Полная конфигурация описана в документации Headplane[^19].

### Запуск

```bash
# 1. Генерация cookie secret
echo "HEADPLANE_COOKIE_SECRET=$(openssl rand -base64 24)" >> .env

# 2. Запуск без Headplane (ему пока нет API-ключа)
docker compose up -d caddy headscale pocket-id

# 3. Создание первого пользователя Headscale
docker exec headscale headscale users create admin

# 4. Генерация API-ключа для Headplane
docker exec headscale headscale apikeys create --expiration 90d
```

Полученный ключ записываем в `.env` как `HEADPLANE_API_KEY`, затем:

```bash
# 5. Запуск Headplane
docker compose up -d headplane
```

### Проверка

```bash
# Headscale health
curl -s https://scale.example.org/health
# Ожидаемый ответ: пустое тело, HTTP 200

# Headplane
curl -s -o /dev/null -w "%{http_code}" https://scale.example.org/admin
# Ожидаемый ответ: 200

# Pocket ID
curl -s -o /dev/null -w "%{http_code}" https://id.example.org
# Ожидаемый ответ: 200
```

После проверки:

1. Открыть `https://id.example.org` — создать администратора Pocket ID и зарегистрировать passkey
2. Открыть `https://scale.example.org/admin` — убедиться, что Headplane показывает пользователя `admin`
3. Подключить первое устройство:

```bash
# Генерация pre-auth ключа
docker exec headscale headscale preauthkeys create --user admin --expiration 1h

# На клиентском устройстве
tailscale up --login-server https://scale.example.org --authkey <KEY>
```

На этом этапе система работает без OIDC: Headplane использует API-ключ, регистрация нод — через pre-auth ключи. Следующий шаг — интеграция с Pocket ID.

## Интеграция: как всё связать

Интеграция с Pocket ID добавляет OIDC-аутентификацию в два места: Headplane (вход администратора в веб-интерфейс) и Headscale (регистрация нод и привязка пользователей).

```text
                          ┌─────────────────────────────────┐
                          │          Caddy (TLS)            │
                          │                                 │
  Браузер / Tailscale ──▶ │  /admin/*  ──▶  Headplane:3000  │
                          │  /*        ──▶  Headscale:8080  │
                          └─────────────────────────────────┘
                                    ▲             ▲
                                    │  OIDC       │  OIDC
                                    ▼             ▼
                              ┌───────────────────────┐
                              │   Pocket ID (OIDC)    │
                              │   id.example.org      │
                              └───────────────────────┘
```

### Регистрация OIDC-клиента в Pocket ID

> **Важно:** Headscale и Headplane должны использовать **один и тот же** OIDC-клиент в Pocket ID. Два разных `client_id` сломают маппинг пользователей между сервисами.

Headscale и Headplane могут использовать **один OIDC-клиент** в Pocket ID[^20]. Это не просто экономия — это необходимость: когда оба сервиса используют один `client_id`, claim `sub` (subject) совпадает, и Headplane автоматически связывает OIDC-пользователя с пользователем Headscale.

В веб-интерфейсе Pocket ID создаём клиент с двумя callback URL:

| Сервис | Callback URL |
| --- | --- |
| Headscale | `https://scale.example.org/oidc/callback` |
| Headplane | `https://scale.example.org/admin/oidc/callback` |

Рекомендуется включить PKCE (S256) в настройках клиента — это защищает от перехвата authorization code.

### Настройка OIDC в Headscale

В `config.yaml` Headscale добавляется секция `oidc`[^21]:

```yaml
oidc:
  issuer: "https://id.example.org"
  client_id: "<client_id_from_pocket_id>"
  client_secret: "<client_secret_from_pocket_id>"
  pkce:
    enabled: true
    method: S256
  scope:
    - openid
    - profile
    - email
  only_start_if_oidc_is_available: true
  allowed_domains:
    - example.org
```

Параметр `allowed_domains` ограничивает регистрацию — только пользователи с email из указанного домена смогут добавлять устройства.

### Настройка OIDC в Headplane

В `config.yaml` Headplane добавляется секция `oidc`[^19]. Полный файл после изменений:

```yaml
headscale:
  url: http://headscale:8080
  config_path: /etc/headscale/config.yaml

oidc:
  issuer: "https://id.example.org"
  client_id: "<client_id_from_pocket_id>"
  client_secret: "<client_secret_from_pocket_id>"
  headscale_api_key: "<same_key_as_ROOT_API_KEY>"
  use_pkce: true

integration:
  docker:
    enabled: true
```

Обратите внимание на два момента:

- **`headscale_api_key`** — обязательное поле в секции `oidc` для Headplane v0.6+. Это тот же API-ключ, что и `ROOT_API_KEY`. Без него Headplane не сможет управлять Headscale после переключения на OIDC.
- **Разный синтаксис PKCE.** В Headscale — `pkce.enabled: true` и `pkce.method: S256`, в Headplane — `use_pkce: true`. Это разные проекты с разными форматами конфигурации. При включении или отключении PKCE в Pocket ID нужно обновить конфиги **обоих** сервисов.

### Применение изменений

После редактирования конфигурационных файлов необходим перезапуск обоих сервисов:

```bash
docker compose restart headscale headplane
```

Проверка:

```bash
# Headplane должен показать форму входа через Pocket ID
curl -s -o /dev/null -w "%{http_code}" https://scale.example.org/admin
# Ожидаемый ответ: 302 (редирект на Pocket ID)
```

Откройте `https://scale.example.org/admin` в браузере — вместо прямого доступа появится кнопка входа через Pocket ID.

### Как работает регистрация ноды через OIDC

После настройки OIDC в Headscale регистрация новых устройств происходит через браузер — без участия администратора[^22]:

| Шаг | Участник | Действие |
| --- | --- | --- |
| 1 | Пользователь | `tailscale up --login-server https://scale.example.org` |
| 2 | Tailscale-клиент | Генерирует RegistrationID, открывает браузер |
| 3 | Браузер | Переход на `https://scale.example.org/register/<id>` |
| 4 | Headscale | Редирект на Pocket ID |
| 5 | Пользователь | Аутентификация passkey в Pocket ID |
| 6 | Pocket ID | Возвращает authorization code на `/oidc/callback` |
| 7 | Headscale | Обмен кода на токен, создание/обновление пользователя, регистрация ноды |
| 8 | Tailscale-клиент | Получает конфигурацию, подключается к tailnet |

Весь процесс занимает секунды. Кэш регистрации действует 15 минут — если пользователь не завершит аутентификацию за это время, нужно повторить `tailscale up`[^22].

При этом pre-auth ключи никуда не исчезают. OIDC-регистрация и pre-auth ключи — взаимодополняющие механизмы:

| Характеристика | Pre-Auth Key | OIDC |
| --- | --- | --- |
| Интерактивность | Нет (автоматическая) | Да (браузер + passkey) |
| Участие администратора | Создаёт ключ заранее | Нет (self-service) |
| Лучше для | Серверы, CI/CD, автоматизация | Пользовательские устройства |
| Профиль пользователя | Нет | Да (имя, email, аватар из Pocket ID) |

### Два пути для уже работающего Headscale

Если Headscale уже работает с пользователями, созданными через CLI, интеграция OIDC создаёт проблему: OIDC-аутентификация создаёт **новых** пользователей, а существующие устройства привязаны к CLI-пользователям. Есть два подхода.

**Путь 1: Чистая миграция.** Настроить OIDC, перелогинить все клиентские устройства:

```bash
# На каждом устройстве
tailscale logout
tailscale up --login-server https://scale.example.org
```

При логине откроется браузер с Pocket ID. После аутентификации Headscale создаст нового OIDC-пользователя с заполненным профилем (имя, email, аватар из Pocket ID). Устройства перепривяжутся к новому пользователю. Этот путь прост, но требует перелогина **каждого** устройства и приводит к появлению пустого старого CLI-пользователя.

**Путь 2: Привязка через базу данных.** Если нужно сохранить существующего пользователя и избежать перерегистрации десятков устройств — можно вручную прописать OIDC-идентификатор в базе Headscale.

Сначала узнаём `sub` (subject) пользователя в Pocket ID:

```bash
docker exec pocket-id sqlite3 /app/backend/data/pocket-id.db \
  'SELECT id, username, email FROM users WHERE username="admin"'
```

Затем обновляем запись в базе Headscale:

```bash
docker exec headscale sqlite3 /var/lib/headscale/db.sqlite \
  'UPDATE users SET
     provider_identifier="https://id.example.org/<user-id>",
     email="admin@example.org",
     display_name="Admin"
   WHERE name="admin"'
```

Формат `provider_identifier` — `<issuer>/<sub>`, где `issuer` — URL вашего Pocket ID, а `sub` — ID пользователя из предыдущего шага[^23].

**Рекомендуемый путь — комбинированный:**

1. Настроить OIDC в Headscale и Headplane
2. Вручную прописать `provider_identifier` для существующих CLI-пользователей
3. Перезапустить Headscale
4. Перелогинить устройства — Headscale найдёт существующего пользователя по `provider_identifier` и обновит профиль из OIDC

Так устройства останутся у того же пользователя, появятся аватар и имя из Pocket ID, и Headplane перестанет показывать пользователя как «unmanaged»[^24].

### Onboarding в Headplane

При первом входе в Headplane через OIDC интерфейс покажет onboarding-диалог: список пользователей Headscale с предложением выбрать, какой из них соответствует текущему OIDC-аккаунту[^20]. Этот выбор сохраняется на уровне Headplane и повторное сопоставление не требуется.

Если `provider_identifier` уже прописан в базе Headscale (путь 2), сопоставление произойдёт автоматически по совпадению `sub` — onboarding-диалог не появится.

## Результат: сеть без консоли

После настройки связки рабочий процесс полностью меняется.

**Доступ к админке только через passkey.** Вход в Headplane — через Pocket ID. Никаких паролей, только биометрия или аппаратный ключ. Компрометация пароля невозможна — паролей нет.

**Регистрация устройств через браузер.** Пользователь выполняет `tailscale up --login-server https://scale.example.org`, открывается браузер с формой входа Pocket ID. После аутентификации passkey устройство автоматически регистрируется в сети. Администратору не нужно генерировать pre-auth ключи или одобрять устройства из консоли.

**Управление из веба.** ACL, DNS, маршруты, пользователи, узлы — всё доступно в Headplane. Редактирование политик доступа — визуальный редактор вместо ручной правки JSON. Одобрение subnet routes и exit nodes — кнопка в интерфейсе вместо `headscale routes enable`.

**Профили пользователей.** Имя, email и аватар подтягиваются из Pocket ID. Эта информация отображается в клиентах Tailscale — каждый участник сети видит, кому принадлежат устройства[^25].

| Было (Headscale CLI) | Стало (Headscale + Headplane + Pocket ID) |
| --- | --- |
| SSH на сервер для любой операции | Веб-интерфейс Headplane |
| `headscale users create` | Кнопка в UI |
| Pre-auth ключи для регистрации | OIDC через Pocket ID в браузере |
| Ручная правка ACL JSON | Визуальный редактор |
| `headscale nodes list` | Дашборд с фильтрами и поиском |
| Нет аутентификации админа | Passkey через Pocket ID |
| Нет аватаров и профилей | Профили из OIDC |

### Что остаётся в CLI

Связка не устраняет CLI полностью. Несколько операций по-прежнему требуют терминала:

- **Pre-auth ключи для серверов и CI/CD.** Автоматическая регистрация устройств без браузера — только через `headscale preauthkeys create`
- **Обновление сервисов.** Обновление контейнеров Headscale, Headplane, Pocket ID — через SSH
- **Бэкапы.** Резервное копирование SQLite-базы Headscale: `docker exec headscale sqlite3 /var/lib/headscale/db.sqlite ".backup '/tmp/headscale.db'" && docker cp headscale:/tmp/headscale.db ./backup-$(date +%Y%m%d).db`
- **Диагностика.** При проблемах с OIDC или сетевой связностью — логи через `journalctl`

Но повседневное управление сетью — добавление пользовательских устройств, настройка маршрутов, редактирование ACL — полностью переходит в браузер.

## Подводные камни

Несколько практических моментов, на которые стоит обратить внимание при настройке.

> **Внимание:** PKCE должен быть включён или выключен **одинаково** в Headscale и Headplane. Рассинхронизация приводит к ошибке `Invalid code verifier`.

**PKCE — синхронно для всех потребителей.** Если PKCE включается или выключается в Pocket ID, нужно обновить конфигурацию и Headscale, и Headplane. Рассинхронизация приведёт к ошибке `Invalid code verifier` при попытке аутентификации.

**Issuer без trailing slash.** Pocket ID возвращает issuer как `https://id.example.org` (без `/` в конце). Во всех конфигурациях нужно указывать URL в том же формате. Несовпадение приведёт к ошибке валидации токена.

**Pocket ID секреты — bcrypt.** В базе данных Pocket ID client secret хранится как bcrypt-хэш. Восстановить его нельзя — только перегенерировать в веб-интерфейсе Pocket ID. При перегенерации нужно обновить secret во всех сервисах, использующих этот клиент.

**Группы пользователей в Pocket ID.** Если к OIDC-клиенту привязаны группы пользователей, только пользователи из этих групп смогут аутентифицироваться. Без явной привязки к группе — вход доступен всем пользователям Pocket ID.

**Недоступность Pocket ID.** Если Pocket ID не отвечает при запуске Headscale, поведение зависит от параметра `only_start_if_oidc_is_available` в конфигурации Headscale. По умолчанию `true` — Headscale не стартует, пока OIDC-провайдер недоступен. Это защищает от ситуации, когда ноды подключаются к серверу с нерабочей аутентификацией. Если Pocket ID падает после старта Headscale — существующие подключения не разрываются, но новые OIDC-регистрации невозможны (pre-auth ключи продолжат работать).

**Label на правильном контейнере.** Label `me.tale.headplane.target` должен быть на контейнере **Headscale**, а не Headplane. Headplane ищет контейнер с этим label через Docker API для отправки сигнала перезапуска. Если label на Headplane — изменение DNS-настроек через UI будет возвращать 502/503.

**Для пользователей Podman:** rootless Podman монтирует файлы по inode. Команды `sed -i`, `cat >` создают новый файл — контейнер продолжает видеть старое содержимое. После изменения `config.yaml` Headscale или Headplane через такие команды необходим полный рестарт контейнера. В Docker эта проблема не возникает.

**Podman Quadlet и Docker-интеграция Headplane.** Headplane кеширует container ID контейнера Headscale при старте и использует его для отправки команды restart через Docker API. В Docker это работает — container ID сохраняется при рестарте. Но Podman Quadlet при каждом рестарте **удаляет и пересоздаёт** контейнер с новым ID. После первого restart через API кешированный ID устаревает, и все последующие попытки завершаются ошибкой `404 no such container`.

Решение для Podman Quadlet — systemd `.path` юнит, который следит за конфигом Headscale и перезапускает его через systemd:

```ini
# ~/.config/systemd/user/headscale-config.path
[Unit]
Description=Watch Headscale config for changes

[Path]
PathModified=%h/.config/containers/systemd/configs/headscale/config.yaml
Unit=headscale-config-reload.service

[Install]
WantedBy=default.target
```

```ini
# ~/.config/systemd/user/headscale-config-reload.service
[Unit]
Description=Restart Headscale after config change

[Service]
Type=oneshot
ExecStart=/usr/bin/systemctl --user restart headscale.service
```

Активация: `systemctl --user enable --now headscale-config.path`. После этого Headplane записывает изменения в конфиг, а systemd автоматически перезапускает Headscale — без Docker API и без проблем с container ID.

## Устранение неполадок

| Симптом | Возможная причина | Действие |
| --- | --- | --- |
| `Invalid code verifier` | PKCE включён только в одном из сервисов | Синхронно включить PKCE в Headscale и Headplane, проверить Pocket ID |
| Headscale не запускается | Pocket ID недоступен при старте | Проверить `only_start_if_oidc_is_available`, временно отключить или убедиться, что `id.example.org` отвечает |
| Ошибка валидации токена | Issuer с trailing slash | Указать `https://id.example.org` без `/` в конце во всех конфигах |
| Headplane показывает пользователя как «unmanaged» | `provider_identifier` не прописан | Выполнить привязку через базу (путь 2 в разделе миграции) |
| 502/503 при изменении DNS в Headplane | Label `me.tale.headplane.target` на контейнере Headplane вместо Headscale | Переместить label на контейнер Headscale, перезапустить оба сервиса |
| `404 no such container` при изменении DNS (Podman Quadlet) | Headplane кеширует container ID, Quadlet пересоздаёт контейнер с новым ID | Использовать systemd `.path` юнит для рестарта (см. «Подводные камни») |
| После правки конфига изменения не применяются (Podman) | Монтирование по inode | `docker compose down && docker compose up -d` |
| Браузер не открывается при `tailscale up` | Клиент ждёт ручного перехода | Открыть вручную `https://scale.example.org/register/<id>` из вывода команды |

> **Совет:** при проблемах с OIDC смотрите логи: `docker logs headscale` и `docker logs pocket-id`. Ошибки обычно указывают на неверный `issuer`, `client_id` или `redirect_uri`.

## Часто задаваемые вопросы

**Нужен ли отдельный OIDC-клиент для Headscale и Headplane?**  
Нет. Один клиент с двумя callback URL: для Headscale и для Headplane. Совпадение `client_id` обеспечивает корректный маппинг пользователей.

**Работают ли pre-auth ключи после включения OIDC?**  
Да. OIDC и pre-auth ключи сосуществуют. Pre-auth остаётся оптимальным способом для серверов и CI/CD.

**Можно ли использовать один домен?**  
Технически да (разные path), но раздельные домены (`scale.*` и `id.*`) упрощают настройку и изоляцию.

**Совместимы ли клиенты Tailscale с Headscale?**  
Да. Используются официальные клиенты Tailscale, меняется только `--login-server`.

## Безопасность

Связка закрывает три основных вектора атак, характерных для self-hosted инфраструктуры.

**Фишинг и кража паролей.** Pocket ID не хранит пароли — аутентификация через WebAuthn. Passkey привязан к конкретному домену, что исключает фишинг: даже если пользователь попадёт на поддельную страницу, браузер не предложит passkey для чужого домена[^11].

**Перехват authorization code.** PKCE (S256) привязывает authorization code к конкретной сессии. Перехваченный code бесполезен без `code_verifier`, который не покидает клиент[^12].

**Несанкционированная регистрация устройств.** Параметр `allowed_domains` в Headscale ограничивает регистрацию по домену email. Можно дополнительно использовать `allowed_users` для списка конкретных пользователей или `allowed_groups` для групп из Pocket ID[^21].

## Заключение

Связка Headscale + Headplane + Pocket ID превращает самохостный координационный сервер из CLI-инструмента для энтузиастов в полноценную платформу управления частной сетью. Headscale обеспечивает координацию и совместимость с клиентами Tailscale. Headplane добавляет визуальное управление: узлы, пользователи, ACL, DNS, маршруты. Pocket ID замыкает цепочку — аутентификация через passkey без паролей и без внешних зависимостей.

Каждый компонент решает свою задачу, все три — open source, все три легковесны и развёртываются в контейнерах. Конфигурация требует внимания к деталям (PKCE-синхронизация, формат `provider_identifier`, callback URL), но результат оправдывает усилия: управление сетью из браузера, регистрация устройств без участия администратора, аутентификация без паролей.

## Источники

[^1]: [Tailscale — официальный сайт](https://tailscale.com/)

[^2]: [Top Open Source Tailscale Alternatives — анализ лицензий](https://pinggy.io/blog/top_open_source_tailscale_alternatives/)

[^3]: [Headscale — GitHub](https://github.com/juanfont/headscale)

[^4]: [Headscale FAQ — о мейнтейнерах и Tailscale Inc.](https://headscale.net/stable/about/faq/)

[^5]: [Headscale-UI — GitHub](https://github.com/gurucomputing/headscale-ui)

[^6]: [Headplane — GitHub](https://github.com/tale/headplane)

[^7]: [Headplane CHANGELOG — v0.6.2](https://headplane.net/CHANGELOG)

[^8]: [Keycloak — официальный сайт](https://www.keycloak.org/)

[^9]: [Authentik — официальный сайт](https://goauthentik.io/)

[^10]: [Zitadel — официальный сайт](https://zitadel.com/)

[^11]: [Pocket ID — GitHub](https://github.com/pocket-id/pocket-id)

[^12]: [RFC 7636 — Proof Key for Code Exchange (PKCE)](https://datatracker.ietf.org/doc/html/rfc7636)

[^13]: [Pocket ID — Releases](https://github.com/pocket-id/pocket-id/releases)

[^14]: [Podman Quadlet documentation](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html)

[^15]: [Caddy — официальный сайт](https://caddyserver.com/)

[^16]: [Caddy — Named matchers](https://caddyserver.com/docs/caddyfile/matchers#named-matchers)

[^17]: [Headscale — Reverse proxy documentation](https://headscale.net/stable/ref/integration/reverse-proxy/)

[^18]: [Headscale — Configuration reference](https://headscale.net/stable/ref/configuration/)

[^19]: [Headplane — Docker installation](https://headplane.net/install/docker)

[^20]: [Headplane SSO documentation — маппинг OIDC-пользователей](https://headplane.net/features/sso)

[^21]: [Headscale OIDC reference](https://headscale.net/stable/ref/oidc/)

[^22]: [Headscale — Registration methods](https://headscale.net/stable/ref/registration/)

[^23]: [GitHub Issue #3112 — OIDC provider_identifier format](https://github.com/juanfont/headscale/issues/3112)

[^24]: [Headplane CHANGELOG — «Unmanaged» users](https://headplane.net/CHANGELOG)

[^25]: [tailcfg.UserProfile — Go documentation](https://pkg.go.dev/tailscale.com/tailcfg#UserProfile)
