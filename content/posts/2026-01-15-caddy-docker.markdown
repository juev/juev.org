---
title: "Caddy Docker: автоматический reverse proxy для домашнего сервера"
date: 2026-01-15T15:21:02+0300
tags:
  - docker
  - caddy
  - selfhosting
  - synology
---

Больше года использую Synology NAS DSM720+ в качестве домашнего сервера. Добавил памяти до 10GB, установил SSD кеш для ускорения работы. Большим преимуществом данной версии NAS является возможность запускать Docker контейнеры, что открывает безграничные возможности для самохостинга.

## Проблема: эволюция доступа к сервисам

### Cloudflare Tunnel: первая попытка

Изначально для доступа к сервисам извне использовал Cloudflare Tunnel. Решение работало отлично, пока его не заблокировали РКН. Пришлось искать альтернативу.

### Tailscale Funnel: неудобная реальность

Следующим шагом стал переход на Tailscale Funnel. Технически это работало, но архитектура оказалась неудобной: контейнер с Tailscale в режиме sidecar приходилось запускать рядом с каждым сервисом.

Проблемы накапливались:

- **Много контейнеров**: для каждого сервиса нужен отдельный Tailscale sidecar
- **Сложные домены**: домены от Tailscale вроде `my-server-12345.ts.net` запомнить невозможно
- **Нет кастомизации**: использовать свои домены с Tailscale Funnel было невозможно
- **Сложность управления**: при добавлении нового сервиса нужно настраивать новый sidecar

Нужно было что-то более элегантное.

## Решение: caddy-docker-proxy

Недавно узнал про [caddy-docker-proxy](https://github.com/lucaslorentz/caddy-docker-proxy) — плагин для Caddy, который автоматически обнаруживает Docker контейнеры и настраивает reverse proxy на основе labels. Это именно то, чего не хватало!

### Что это дает

- **Автоматическое обнаружение**: Caddy сам находит контейнеры в Docker сети
- **Без перезапусков**: добавление нового сервиса не требует перезапуска Caddy
- **Свои домены**: полный контроль над доменными именами
- **SSL из коробки**: автоматическое получение сертификатов через Let's Encrypt
- **Один контейнер**: вместо множества sidecar'ов — один Caddy для всех сервисов

## Настройка: пошаговая инструкция

### Шаг 1: Подготовка Docker образа Caddy

Так как на Synology NAS не очень быстрый CPU, решил собирать Caddy с нужными плагинами через GitHub Actions. Использовал ранее подготовленный репозиторий [juev/caddy](https://github.com/juev/caddy), изменив только список плагинов.

Используемые плагины:

1. **[caddy-dns/cloudflare](https://github.com/caddy-dns/cloudflare)** — для автоматического получения SSL сертификатов через Cloudflare DNS challenge
2. **[mholt/caddy-l4](https://github.com/mholt/caddy-l4)** — для L4 проксирования TCP-соединений (SSH, базы данных и т.д.)
3. **[lucaslorentz/caddy-docker-proxy](https://github.com/lucaslorentz/caddy-docker-proxy/v2)** — для автоматического обнаружения и проксирования Docker сервисов

### Шаг 2: Создание Docker сети

Создаем отдельную сеть для Caddy и всех сервисов:

```bash
docker network create caddy
```

Эта сеть будет использоваться всеми контейнерами, которые должны быть доступны через Caddy.

### Шаг 3: Настройка docker-compose для Caddy

Создаем `docker-compose.yml` для Caddy:

```yaml
services:
  # Tailscale контейнер для VPN доступа
  ts-caddy:
    image: tailscale/tailscale:latest
    hostname: caddy
    container_name: caddy-tailscale
    networks:
      - caddy
    environment:
      # Ключ авторизации из Tailscale Admin Console
      - TS_AUTHKEY=${TS_AUTHKEY}
      # Теги для управления доступом
      - TS_EXTRA_ARGS=--advertise-tags=tag:container
      # Директория для хранения состояния
      - TS_STATE_DIR=/var/lib/tailscale
    volumes:
      - tailscale-data:/var/lib/tailscale
    devices:
      - /dev/net/tun:/dev/net/tun
    cap_add:
      - net_admin  # Для работы с сетью
      - sys_module  # Для загрузки модулей ядра
    restart: unless-stopped

  # Caddy reverse proxy
  caddy:
    image: ghcr.io/juev/caddy:latest
    container_name: caddy
    # Используем сетевой стек Tailscale контейнера
    # Это позволяет Caddy использовать Tailscale IP напрямую
    network_mode: "service:ts-caddy"
    volumes:
      # Основной конфигурационный файл
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      # Данные для хранения сертификатов
      - caddy_data:/data
      # Конфигурация Caddy
      - caddy_config:/config
      # Docker socket для автоматического обнаружения контейнеров
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      # Путь к Caddyfile (используется caddy-docker-proxy)
      - CADDY_DOCKER_CADDYFILE_PATH=/etc/caddy/Caddyfile
      # API токен Cloudflare для DNS challenge
      - CLOUDFLARE_API_TOKEN=${CLOUDFLARE_API_TOKEN}
      # Не проксировать контейнеры без labels по умолчанию
      - CADDY_DOCKER_EXPOSEDBYDEFAULT=false
      # Сеть, в которой искать контейнеры
      - CADDY_INGRESS_NETWORKS=caddy
    restart: unless-stopped

networks:
  caddy:
    external: true

volumes:
  caddy_data:
  caddy_config:
  tailscale-data:
    driver: local
```

### Шаг 4: Настройка переменных окружения

Создаем файл `.env` в той же директории:

```plain
# Cloudflare API Token с правами на редактирование DNS
# Создается в Cloudflare Dashboard → My Profile → API Tokens
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token_here

# Tailscale Auth Key (одноразовый ключ)
# Создается в Tailscale Admin Console → Settings → Keys
TS_AUTHKEY=tskey-auth-xxxxxxxxx-xxxxxxxxx
```

**Важно**:

- `CLOUDFLARE_API_TOKEN` должен иметь права на редактирование DNS записей

### Шаг 5: Настройка Caddyfile

Создаем `Caddyfile` с базовой конфигурацией:

```caddyfile
{
    # Email для уведомлений Let's Encrypt
    email name@example.com

    # Глобальная настройка DNS challenge через Cloudflare
    # Работает для всех доменов автоматически
    acme_dns cloudflare {env.CLOUDFLARE_API_TOKEN}

    # Отключаем HTTP/3 (QUIC) для совместимости с Safari iOS через Tailscale
    # Safari iOS использует HTTP/3 по умолчанию, но QUIC может иметь проблемы
    # через Tailscale VPN
    servers {
        protocols h1 h2
    }

    # L4 проксирование для TCP-соединений
    # В данном случае проксируем SSH (порт 22) к Forgejo
    layer4 {
        :22 {
            route {
                proxy forgejo:22
            }
        }
    }
}

# Статический домен для админки Synology NAS
# Используем внутренний IP Docker сети для доступа к хосту
nas.example.com {
    reverse_proxy 172.27.0.1:5000
}
```

**Объяснение настроек**:

- `acme_dns cloudflare` — автоматическое получение SSL сертификатов через Cloudflare DNS challenge (работает даже без открытых портов)
- `protocols h1 h2` — используем только HTTP/1.1 и HTTP/2, отключаем HTTP/3 для совместимости
- `layer4` — проксирование на уровне TCP (для SSH, баз данных и т.д.)
- `172.27.0.1` — это IP адрес хоста внутри Docker сети (стандартный gateway)

### Шаг 6: Настройка DNS в Cloudflare

В Cloudflare DNS создаем A-запись:

- **Имя**: `nas` (или любое другое)
- **Тип**: A
- **IPv4 адрес**: Tailscale IP адрес контейнера `caddy-tailscale`
- **Proxy**: выключен (серый облачко)

После запуска контейнеров можно узнать Tailscale IP командой:

```bash
docker exec caddy-tailscale tailscale ip
```

### Шаг 7: Запуск

Запускаем Caddy:

```bash
docker-compose up -d
```

Проверяем логи:

```bash
docker-compose logs -f caddy
```

Если все настроено правильно, через несколько секунд вы получите доступ к админке NAS по адресу `https://nas.example.com` с автоматически полученным SSL сертификатом!

## Автоматическое обнаружение сервисов

Самое интересное начинается сейчас. Для контейнеров, которые хотим видеть в вебе, достаточно добавить labels в `docker-compose.yml`. Caddy автоматически обнаружит их и настроит reverse proxy.

### Как это работает

1. Caddy через Docker socket читает информацию о всех контейнерах в сети `caddy`
2. Ищет контейнеры с label `caddy`
3. Автоматически создает конфигурацию reverse proxy
4. Получает SSL сертификат через Cloudflare DNS challenge
5. Настраивает маршрутизацию без перезапуска

### Пример: WebDAV сервис

Вот пример настройки WebDAV сервиса:

```yaml
services:
  webdav:
    image: bytemark/webdav
    container_name: webdav
    restart: always
    networks:
      - caddy  # Подключаем к сети Caddy
    environment:
      - TZ=Europe/Moscow
    volumes:
      - ./dav:/var/lib/dav
      - /etc/localtime:/etc/localtime:ro
    labels:
      # Домен для доступа к сервису
      caddy: "dav.example.com"
      # Директива reverse_proxy с автоматическим определением upstream
      # {{upstreams 80}} автоматически найдет IP:порт контейнера на порту 80
      caddy.reverse_proxy: "{{upstreams 80}}"

networks:
  caddy:
    external: true
```

После запуска контейнера (`docker-compose up -d`) Caddy автоматически:

- Обнаружит новый контейнер
- Настроит reverse proxy на `dav.example.com`
- Получит SSL сертификат
- Настроит маршрутизацию

**Никаких перезапусков Caddy не требуется!**

### Пример: веб-приложение на другом порту

Если ваш сервис работает на порту 8080:

```yaml
services:
  myapp:
    image: myapp:latest
    container_name: myapp
    networks:
      - caddy
    labels:
      caddy: "app.example.com"
      # Указываем конкретный порт
      caddy.reverse_proxy: "{{upstreams 8080}}"
```

### Пример: несколько доменов для одного сервиса

```yaml
services:
  myapp:
    image: myapp:latest
    container_name: myapp
    networks:
      - caddy
    labels:
      caddy: "app.example.com, www.app.example.com"
      caddy.reverse_proxy: "{{upstreams 80}}"
```

### Пример: дополнительные директивы Caddy

Можно использовать любые директивы Caddy через labels:

```yaml
services:
  myapp:
    image: myapp:latest
    container_name: myapp
    networks:
      - caddy
    labels:
      caddy: "app.example.com"
      caddy.reverse_proxy: "{{upstreams 80}}"
      # Добавляем базовую аутентификацию
      caddy.basicauth: "/admin admin:$2a$14$encrypted_password"
      # Включаем сжатие
      caddy.encode: "gzip zstd"
      # Кастомные заголовки
      caddy.header: "X-Custom-Header \"My Value\""
```

## L4 проксирование для TCP

Плагин `caddy-l4` позволяет проксировать TCP-соединения. Это полезно для:

- SSH доступа к контейнерам
- Проксирования баз данных
- Любых других TCP-протоколов

В примере выше мы настроили проксирование SSH к Forgejo:

```caddyfile
layer4 {
    :22 {
        route {
            proxy forgejo:22
        }
    }
}
```

Теперь можно подключаться по SSH через Tailscale IP на порт 22, и соединение будет автоматически проксироваться к Forgejo контейнеру.

## Преимущества решения

После перехода на caddy-docker-proxy получил:

✅ **Один контейнер вместо множества** — больше не нужно запускать Tailscale sidecar для каждого сервиса

✅ **Свои домены** — полный контроль над доменными именами через Cloudflare

✅ **Автоматические SSL сертификаты** — Let's Encrypt сертификаты получаются автоматически через Cloudflare DNS challenge

✅ **Нет перезапусков** — добавление нового сервиса не требует перезапуска Caddy

✅ **Простота управления** — все настройки через Docker labels

✅ **L4 проксирование** — поддержка TCP-протоколов (SSH, базы данных)

✅ **Производительность** — один reverse proxy для всех сервисов, меньше overhead

## Troubleshooting

### Проблема: Caddy не видит контейнеры

**Решение**:

- Убедитесь, что контейнер подключен к сети `caddy`
- Проверьте, что `CADDY_INGRESS_NETWORKS=caddy` установлен в environment
- Убедитесь, что Docker socket монтирован: `/var/run/docker.sock:/var/run/docker.sock:ro`

### Проблема: SSL сертификат не получается

**Решение**:

- Проверьте правильность `CLOUDFLARE_API_TOKEN`
- Убедитесь, что токен имеет права на редактирование DNS
- Проверьте логи Caddy: `docker logs caddy`

### Проблема: домен не резолвится

**Решение**:

- Проверьте A-запись в Cloudflare DNS
- Убедитесь, что Tailscale IP правильный: `docker exec caddy-tailscale tailscale ip`
- Проверьте, что Proxy в Cloudflare выключен (серое облачко)

### Проблема: Safari iOS не работает

**Решение**:

- Убедитесь, что HTTP/3 отключен в Caddyfile (`protocols h1 h2`)
- Это известная проблема с QUIC через Tailscale VPN

## Безопасность

### Рекомендации

1. **Docker socket**: монтируйте только в режиме read-only (`:ro`)
2. **API токены**: храните в `.env` файле, не коммитьте в Git
3. **Сеть**: используйте отдельную Docker сеть для изоляции
4. **Firewall**: настройте firewall на Synology для дополнительной защиты

### Ограничение доступа

Можно использовать Tailscale ACL для ограничения доступа:

```yaml
environment:
  - TS_EXTRA_ARGS=--advertise-tags=tag:container
```

Затем в Tailscale Admin Console настроить ACL правила для тега `tag:container`.

## Производительность на Synology NAS

### Оптимизация

1. **SSD кеш**: установка SSD кеша значительно ускоряет работу Docker
2. **Память**: 10GB RAM достаточно для множества контейнеров
3. **CPU**: сборка Caddy через GitHub Actions экономит ресурсы NAS
4. **Сеть**: использование одной сети `caddy` уменьшает overhead

### Мониторинг

Следите за использованием ресурсов:

```bash
# Использование ресурсов контейнеров
docker stats

# Логи Caddy
docker logs -f caddy

# Статус Tailscale
docker exec caddy-tailscale tailscale status
```

## Заключение

Переход на caddy-docker-proxy кардинально упростил управление домашним сервером. Теперь добавление нового сервиса — это просто добавление нескольких labels в docker-compose.yml. Никаких перезапусков, никаких сложных конфигураций.

Решение отлично подходит для:

- Домашних серверов на Synology NAS
- Самохостинга множества сервисов
- Ситуаций, когда нужны свои домены
- Автоматизации получения SSL сертификатов

Если вы тоже используете Docker для самохостинга, обязательно попробуйте caddy-docker-proxy — это действительно меняет подход к управлению reverse proxy!
