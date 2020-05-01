---
title: "Wireguard and Pi-Hole"
date: 2020-05-01T17:50:31+0300
image: https://static.juev.org/2020/05/pi-hole.png
tags:
  - vpn
  - dns
  - wireguard
  - privacy
---
## Wireguard

Когда использовал [mullvad](https://mullvad.net/ru/), подключался с использованием Wireguard, очень нравилось быстрое подключение, высокие скорости соединения и низкая латантность подключения. Пытался неоднократно организовать подключение на своем сервере, но каждый раз возникали какие-то сложности.

И вот, нашел довольно простой способ организации wireguard-сервера с использованием docker-контейнеров. Гарантировано работает только на серверах debian/ubuntu, размещено на dockerhub: [linuxserver/wireguard](https://hub.docker.com/r/linuxserver/wireguard).

Запускать можно как прямым вызовом docker через командную строку, так и через docker-compose. Последний мне нравится куда больше ввиду того, что конфигурацию легко переносить.

Создаем файл `docker-compose.yaml` со следующим содержимым:

```yaml
---
version: "3"
services:
  wireguard:
    image: linuxserver/wireguard
    container_name: wireguard
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    environment:
      - PUID=1001
      - PGID=1001
      - TZ=Europe/Moscow
      - SERVERURL=auto
      - SERVERPORT=51820 #optional
      - PEERS=5 #optional
      - PEERDNS=auto
      - INTERNAL_SUBNET=10.13.13.0 #optional
    volumes:
      - /home/user/wireguard/config:/config
      - /lib/modules:/lib/modules
    ports:
      - 51820:51820/udp
    sysctls:
      - net.ipv4.conf.all.src_valid_mark=1
    restart: unless-stopped
```

Подробное описание всех опций размещается на странице контейнера.

Я размещал `docker-compose.yaml` в директории на сервере `/home/user/wireguard`. И для хранения конфигурационных файлов создаем в ней же поддиректорию `config`. Именно в ней затем будут создаваться файлы для подключения пиров.

Текущая директория должна быть `/home/user/wireguard`, используем команду запуска контейнера:

```bash
docker-compose up -d
```

Примерно в течение минуты wireguard запускается, долго ввиду того, что проводиться обновление модулей kernel. Текущий процесс можно наблюдать с помощью команды:

```bash
docker logs -f wireguard
```

После того, как контейнер запуститься, в директории с конфигурацией будут созданы новые поддиректории с конфигурациями подключения для новых пиров, пример:

```bash
~/wireguard/config $ ls -1
coredns
peer1
peer2
peer3
peer4
peer5
server
templates
wg0.conf
```

В этих директориях будут так же размещаться png-файлы с qr-кодами для быстрой передачи конфигурации на клиентов.

Обращаю внимание на то, необходимо внести изменения в конфигурацию клиента, а именно в параметре Allowed IP удалить ipv6 адрес, в противном случае будут возникать проблемы с подключением.

# Pi-Hole

Много слышал про [pi-hole](https://pi-hole.net/), и давно хотел использовать его на своем собственном сервере. Но не удавалось ввиду того, что используемая конфигурация доступна всем, в том числе и админка, от которой отказываться очень не хотелось.

И вот теперь, после того, как удалось завести в работу wireguard, стало возможным использовать и pi-hole. Причем очень безопасно и прозрачно. Достаточно было только запустить два контейнера, и wireguard и pi-hole в одной сети. Для этого меняем `docker-compose.yaml` файл следующим образом:

```yaml
---
version: "3"
services:
  wireguard:
    image: linuxserver/wireguard
    container_name: wireguard
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    environment:
      - PUID=1001
      - PGID=1001
      - TZ=Europe/Moscow
      - SERVERURL=auto
      - SERVERPORT=51820 #optional
      - PEERS=5 #optional
      - PEERDNS=auto
      - INTERNAL_SUBNET=10.13.13.0 #optional
    volumes:
      - /home/evsyukov/wireguard/config:/config
      - /lib/modules:/lib/modules
    ports:
      - 51820:51820/udp
    sysctls:
      - net.ipv4.conf.all.src_valid_mark=1
    restart: unless-stopped
    networks:
      wireguard:
          ipv4_address: 172.24.0.2
  pihole:
    container_name: pihole
    image: pihole/pihole:latest
    environment:
      TZ: 'Europe/Moscow'
      WEBPASSWORD: 'versy secret password'
      DNS1: '1.1.1.1'
      DNS2: '1.0.0.1'
    # Volumes store your data between container upgrades
    volumes:
       - './etc-pihole/:/etc/pihole/'
       - './etc-dnsmasq.d/:/etc/dnsmasq.d/'
    dns:
      - 127.0.0.1
      - 1.1.1.1
    # Recommended but not required (DHCP needs NET_ADMIN)
    #   https://github.com/pi-hole/docker-pi-hole#note-on-capabilities
    cap_add:
      - NET_ADMIN
    restart: unless-stopped
    networks:
      wireguard:
          ipv4_address: 172.24.0.3
networks:
  wireguard:
    ipam:
        driver: default
        config:
            - subnet: 172.24.0.0/16
```

Создаем отдельную сеть `wireguard`, в ней жестко задаем определенные ip, которые будут использоваться при инициализации контейнеров. В противном случае ip будем меняться при каждом запуске, и определять конфигурацию будет проблематично.

Необходимо будет создать ряд поддиректорий для конфигурации pi-hole:

```bash
mkdir /home/user/wireguard/{etc-dnsmasq.d,etc-pihole}
```

После инициализации контейнеров необходимо будет внести изменение в конфигурацию `coredns`, который используется для управления dns в wireguard. Для этого меняем файл `/home/user/wireguard/config/coredns/Corefile`, приведя его к виду:

```conf
. {
    forward . 172.24.0.3
}
```

После чего все dns-запросы будет адресоваться в pi-hole.

Более того, после подключения к своему vpn, можно в веб-браузере открыть админку pi-hole: `http://172.24.0.3/admin`, где будет доступна как статистика, так и управление сервером:

![](https://static.juev.org/2020/05/pi-hole.png)

Таким образом, создав подключения для каждого из своих устройств, можно уже не беспокоиться не только о безопасности своего подключения, но и о безопасности веб-серфинга. Необходимо только корректно определить список блокировок.

## Список блокировок

По умолчанию в pi-hole используется следующий список блок-листов:

```conf
https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts
https://mirror1.malwaredomains.com/files/justdomains
http://sysctl.org/cameleon/hosts
https://s3.amazonaws.com/lists.disconnect.me/simple_tracking.txt
https://s3.amazonaws.com/lists.disconnect.me/simple_ad.txt
```

Полезно иметь его перед глазами, когда вносишь правки, чтобы легко можно было вернуть на прежнее место.

Я решил использовать конфигурацию, что использовал в [Nextdns](https://nextdns.io/). Доступные списки можно найти в репозитории [nextdns/metadata](https://github.com/nextdns/metadata). Ранее я использовал список по умолчанию и добавлял списки от Adguard, получился следующий набор блокировок:

```conf
https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts
https://s3.amazonaws.com/lists.disconnect.me/simple_ad.txt
https://s3.amazonaws.com/lists.disconnect.me/simple_tracking.txt
https://raw.githubusercontent.com/jdlingyu/ad-wars/master/hosts
https://raw.githubusercontent.com/vokins/yhosts/master/hosts
https://raw.githubusercontent.com/tiuxo/hosts/master/ads
https://filters.adtidy.org/extension/chromium/filters/1.txt
https://filters.adtidy.org/extension/chromium/filters/2.txt
https://filters.adtidy.org/extension/chromium/filters/3.txt
https://adguardteam.github.io/AdGuardSDNSFilter/Filters/filter.txt
```

И пока он меня устраивает. Единственно, сформировал определенный список для whitelist:

```conf
alluremedia.com.au
api.ipify.org
bit.ly
clients2.google.com
clients3.google.com
clients4.google.com
clients5.google.com
dl.dropbox.com
goo.gl
gravatar.com
imgs.xkcd.com
j.mp
netflix.com
ocsp.apple.com
ow.ly
rover.ebay.com
s.shopify.com
s3.amazonaws.com
tinyurl.com
tomshardware.com
www.bit.ly
yandex.ru
```

Это домены, которые не являются опасными, и которые не должны блокироваться.

Таким простым образом удалось организовать как безопасное подключение, так и управляемый dns-сервер, позволяющий блокировать рекламу и жучки на страницах сайта.
