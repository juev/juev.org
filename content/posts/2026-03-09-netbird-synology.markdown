---
title: "Установка Netbird на Synology NAS"
date: 2026-03-09T17:43:02+0300
tags:
  - docker
  - netbird
  - network
  - synology
  - nas
  - wireguard
---

[Netbird](https://netbird.io/) — это open-source решение для создания приватных сетей поверх WireGuard. В отличие от классического VPN, Netbird строит mesh-сеть между устройствами, где трафик идёт напрямую между пирами без центрального сервера. Это удобно, когда нужно связать домашний NAS, рабочий ноутбук и VPS в единую сеть без возни с пробросом портов и динамическими IP.

Synology NAS — отличный кандидат для подключения к такой сети: получаем доступ к файлам и сервисам NAS из любой точки мира. Но установка клиента Netbird на Synology оказалась нетривиальной задачей.

## Проблема

Нативный клиент Netbird на Synology DSM не работает. При запуске в docker в логах появляется ошибка:

```plain
ERRO client/internal/connect.go:317: error while starting Netbird Connection Engine: create firewall manager: create firewall: no firewall manager found
```

Причина в том, что ядро Linux на Synology DSM собрано с ограничениями — отсутствуют необходимые модули для управления файрволом (nftables/iptables), которые Netbird использует для маршрутизации трафика. Штатными средствами DSM эту проблему не решить.

## Решение: запуск через Docker

Docker-контейнер позволяет обойти ограничения ядра, запустив WireGuard в userspace-режиме. Создаём `docker-compose.yml`:

```yaml
services:
  netbird:
    image: netbirdio/netbird:latest
    container_name: netbird
    restart: always
    network_mode: "host"
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    environment:
      - NB_SETUP_KEY=<your-setup-key>
      - NB_WG_KERNEL_DISABLED=true
    volumes:
      - ./config:/etc/netbird
    devices:
      - /dev/net/tun:/dev/net/tun
```

Запускаем:

```bash
docker compose up -d
```

## Разбор параметров

- **`network_mode: "host"`** — контейнер использует сетевой стек хоста напрямую, что необходимо для создания WireGuard-туннелей.
- **`NET_ADMIN`** — разрешает управление сетевыми интерфейсами, маршрутами и правилами файрвола.
- **`SYS_MODULE`** — разрешает загрузку модулей ядра (может потребоваться для TUN/TAP).
- **`NB_SETUP_KEY`** — ключ регистрации, который генерируется в панели управления Netbird (Setup Keys).
- **`NB_WG_KERNEL_DISABLED=true`** — ключевой параметр. Отключает kernel-mode WireGuard и переключает на userspace-реализацию. Именно это решает проблему с отсутствующими модулями ядра на Synology.
- **`/dev/net/tun`** — устройство для создания виртуальных сетевых интерфейсов (TUN/TAP).

## Проверка

После запуска в логах могут появиться предупреждения — это нормально для userspace-режима. Убедиться, что клиент подключился:

```bash
docker logs netbird
```

В логах должно быть сообщение об успешном подключении к management-серверу. После этого NAS появится в списке пиров в [панели управления Netbird](https://app.netbird.io/) и станет доступен по назначенному IP из mesh-сети.
