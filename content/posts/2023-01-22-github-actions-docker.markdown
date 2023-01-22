---
title: "Docker and Github Actions"
date: 2023-01-22T10:47:11+0300
image: https://static.juev.org/2023/01/retry.png
tags: 
  - github
  - tips
  - docker
---

Чуть раньше описал решение проблемы с [загрузкой файлов][retry], которая
периодически возникает в работе Github Actions. Но потом подумал о том, что
было бы не плохо запускать процесс с уже готовым образом, со всеми необходимыми
программами, чтобы не тратить время на загрузку и подготовку к работе.

Github Actions позволяет это делать с помощью ключевого слова `container`:

```yaml
jobs:
  fetch:
    runs-on: ubuntu-latest
    container: ghcr.io/juev/getpocket-collector:latest
```

Для того, чтобы использовать контейнер в пайплайне, его необходимо изначально
подготовить. Для этого использовал простейший `Dockerfile`:

```docker
FROM bash:latest

ARG TARGETARCH="amd64"
ARG TARGETOS="linux"
ARG TARGETPLATFORM="linux/amd64"

WORKDIR /app

ADD https://github.com/juev/rss-parser/releases/latest/download/rss-parser-linux-amd64 /app/rss-parser
ADD https://github.com/juev/getpocket-collector/releases/latest/download/getpocket-collector-linux-amd64 /app/getpocket-collector

RUN set -eux; \
    \
    apk add --no-cache curl; \
    rm -rf /var/cache/apk; \
    \
    chmod +x /app/rss-parser /app/getpocket-collector;
```

Но при использовании в Github Actions стокнулся с тем, что в репозитории, где
требовалось провести комит результата, возникала ошибка:

```plain
Error: Error: fatal: detected dubious ownership in repository at '/__w/links/links'
To add an exception for this directory, call:

	git config --global --add safe.directory /__w/links/links
```

Целый день потратил на разбор проблемы, проверял и конфигурацию git, и права
доступа к файлам. Пока не прогнал пайплайн с выводом базовой информации по
окружению и пользователям в Github Actions без контейнеров. Выявил, что
`USER_ID` у пользователя, под которым выполняются все операции `1001`, а не
`1000`, как считается обычно.

Привел Dockerfile к следующему виду, добавив пользователя с определенным id:

```docker
FROM bash:latest

ARG TARGETARCH="amd64"
ARG TARGETOS="linux"
ARG TARGETPLATFORM="linux/amd64"

ARG USER_UID=1001

ADD https://github.com/juev/rss-parser/releases/latest/download/rss-parser-linux-amd64 /usr/local/bin/rss-parser
ADD https://github.com/juev/getpocket-collector/releases/latest/download/getpocket-collector-linux-amd64 /usr/local/bin/getpocket-collector

RUN set -eux; \
    \
    apk add --no-cache curl git jq; \
    rm -rf /var/cache/apk; \
    \
    adduser -D runner -u $USER_UID; \
    chmod +rx /usr/local/bin/rss-parser /usr/local/bin/getpocket-collector;

USER runner
```

И комит прошел без проблем.

Таким образом, если вы планируете использовать готовые docker-контейнеры в
github actions, не забудьте создать нового пользователя с USER_ID=1001, и тогда
при запуске пайплайна не будет возникать проблем с доступами к файлам.

Ну а я перевел два своих репозитория на сборку не только бинарников, но и на
подготовку docker-контейнеров, что использую в своих крон-репозиториях:

- [juev/getpocket-collector](https://github.com/juev/getpocket-collector)
- [juev/rss-parser](https://github.com/juev/rss-parser)

Теперь не нужно тратить время на загрузку бинарников и решать проблемы с сетевой
недоступностью.

[retry]: https://www.juev.org/2023/01/20/retry/