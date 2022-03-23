---
layout: post
title: "Alpine on Raspberry PI"
date: 2021-10-28T08:31:00+0300
image: https://static.juev.org/2021/10/library-alpine-logo.png
tags:
  - raspberrypi
  - alpine
  - docker
---
Довольно давно использовал [Miniflux на Heroku](https://www.juev.org/2020/12/20/miniflux-on-heroku/). Из проблем только ограничения на размер базы данных, из-за которого приходилось запускать периодическую чистку данных. В результате имел оперативный доступ к новым данным, но не было возможности что-то сохранять в архив.

Недавно подключил свой Raspberry PI напрямую к роутеру по кабелю, решив тем самым всем проблемы с WiFi. И решил перенести Miniflux на свой домашний сервер. Все необходимое было уже подготовлено ранее: [juev/docker-compose](https://github.com/juev/docker-compose). Поэтому на запуск ушло порядка 10 минут, включая установку docker и docker-compose. Удивило то, что в разделе сессии отображалось, что я входил 13 лет назад. Стал разбираться.

Проверяю дату в запущенном контейнере:

```bash
pi@raspberrypi:~/Projects/miniflux $ docker exec -it miniflux_miniflux_1  date
Fri Apr 24 11:44:32 MSK 2071
```

Почему? [Как оказалось](https://blog.samcater.com/fix-workaround-rpi4-docker-libseccomp2-docker-20/), проблема заключается в устаревшем пакете libseccomp2, что входит в состав Buster. И с его несовместимостью с последними версиями образа Alpine, что как раз используется в [miniflux](https://github.com/miniflux/v2/blob/master/packaging/docker/Dockerfile). И предлагается решение в виде использования backports репозитория:

```bash
# Get signing keys to verify the new packages, otherwise they will not install
pi@raspberrypi:~ $ sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 04EE7237B7D453EC 648ACFD622F3D138

# Add the Buster backport repository to apt sources.list
pi@raspberrypi:~ $ echo 'deb http://httpredir.debian.org/debian buster-backports main contrib non-free' | sudo tee -a /etc/apt/sources.list.d/debian-backports.list

pi@raspberrypi:~ $ sudo apt update
pi@raspberrypi:~ $ sudo apt install libseccomp2 -t buster-backports
```

После обновления перезапускаем docker и проверяем:

```bash
pi@raspberrypi:~ $ sudo systemctl restart docker
pi@raspberrypi:~/Projects/miniflux $ docker exec -it miniflux_miniflux_1 date
Mon Oct 25 08:00:12 MSK 2021
```

Теперь все в порядке и miniflux нормально работает.
