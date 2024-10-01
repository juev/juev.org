---
title: "gotoSocial"
date: 2024-10-01T20:24:02+0300
tags: 
  - mastodon
  - twitter
  - server
  - service
  - docker
---

После блокировки твиттера на территории России я нашел пристанище в лице Mastodon. Децентрализованное решение,
альтернатива твиттера.

Перепробовав целый ряд серверов, остановился на hachyderm.io. На тот момент времени это был один из самых больших и
самых продвинутых инстансов.

Не так давно решил поднять собственный сервер. В качестве основы выбрал gotosocial. Разворачивается довольно быстро.

`docker-compose.yaml` файл:

```yaml
services:
  gotosocial:
    image: superseriousbusiness/gotosocial:latest
    container_name: gotosocial
    user: 1000:1000
    environment:
      GTS_HOST: domain.org
      GTS_DB_TYPE: sqlite
      GTS_DB_ADDRESS: /gotosocial/storage/sqlite.db
      GTS_LETSENCRYPT_ENABLED: "false"
      GTS_LETSENCRYPT_EMAIL_ADDRESS: ""
      ## Tune limits
      GTS_ADVANCED_RATE_LIMIT_REQUESTS: 0
      GTS_ADVANCED_THROTTLING_MULTIPLIER: 0
      ## Set the timezone of your server:
      TZ: Europe/Moscow
    volumes:
      - ./data:/gotosocial/storage
    restart: "always"

  cloudflared:
    image: cloudflare/cloudflared:latest
    command: 'tunnel --no-autoupdate run --token <token>'
    restart: always
    read_only: true
    user: root
```

Преимущества от использования gotosocial:

- все данные на моем сервере, не нужно беспокоится о сохранности и доступности
- я сам выбираю в какие моменты времени мне нужно обновлять сервер, и когда он будет доступен
- минимальные затраты системных ресурсов

Недостатки, с которыми столкнулся:

- мало клиентов поддерживают работу gotosocial. Вроде бы mastodon, но оказалось, что у gotosocial есть своя специфика,
в связи с чем ряд клиентов не умеет работать с сервером.
- возникают проблемы с доступностью сторонних серверов. В результате мне так и не удалось перенести все подписки с
hachyderm.io на свой сервер.
- системные ресурсы расходуются по минимуму, но дисковое пространство за чуть больше неделю использования забилось
почти на 7 гигабайт. Это при условии использования только одним пользователем.
- отсутствие других пользователей на сервере делает невозможным поиск по темам или подписки на теги.

Свой сервер это приятно, но в результате я решил отказаться от него. Оставив доступным только аккаунт на hachyderm.io.
