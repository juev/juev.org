---
title: "Доступ в Github packages"
date: 2025-01-11T13:12:02+0300
tags: 
  - github
  - actions
---

Завел приватный репозиторий, настроил сборку и публикацию docker контейнеров в Github packages.
Затем изменил доступ к репозиторию на публичный и с удивлением увидел ошибку при обращении к packages:

```sh
~
 21:34:48  ❯ docker pull ghcr.io/juev/sync:latest
Error response from daemon: Head "https://ghcr.io/v2/juev/sync/manifests/latest": unauthorized
```

Много времени потраил на разбирательства, в чем проблема. Оказалось, что доступы в Github packages наследуются
от доступов в репозиторий, но в целом управляются отдельно. То есть если создается приватный репозиторий, то и
доступ к Github packages будет приватным. Изменив доступ к репозиторию мы не меняем доступ к packages.

Таким образом для решения проблемы потребовалось перейти на страницу
[pkgs/container](https://github.com/juev/sync/pkgs/container/sync) и тут перейти в настройки. Где в разделе Danger Zone
можно изменить область видимости для пакетов.

После чего доступ к контейнерам будет так же публичным:

```sh
~
 14:49:55  ❯ docker pull ghcr.io/juev/sync:latest
latest: Pulling from juev/sync
52f827f72350: Already exists
250c06f7c38e: Already exists
bdd834a04de0: Pull complete
Digest: sha256:0392ebe4ea29ed680a1c52fd9862b1688d6e7bb1e3569b97744b117e56688647
Status: Downloaded newer image for ghcr.io/juev/sync:latest
ghcr.io/juev/sync:latest
```

Записал себе на будущее, чтобы не забыть.
