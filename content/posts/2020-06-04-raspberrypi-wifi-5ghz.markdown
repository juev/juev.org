---
title: "Raspberry Pi проблема с WiFi 5Ghz"
date: 2020-06-04T19:25:31+0300
image: https://static.juev.org/2020/06/rasp04.jpeg
tags:
  - raspberrypi
---
## Raspberry Pi

Давно думал о покупке Raspberry Pi. И только сейчас собрался. Просмотрел магазины Москвы, где малинка 4 версии на 2 гигабайта памяти обходилась в среднем более 8 тыс рублей, почти купил, но решил обратить внимание на Aliexpress. Где, как оказалось в дальнейшем, можно купить набор получше за чуть более 4500 рублей, это с учетом доставки. В результате заказал именно там.

Ждать пришлось почти три недели, но было отслеживание и информирование о том, где находиться посылка. Время пролетело незаметно.

В наборе была сама малинка, алюминиевый корпус с активным охлаждением, карта памяти на 64 гигабайта и карт-ридер, блок питания и кабель hdmi.

![raspberry](https://static.juev.org/2020/06/rasp01.jpeg)

Чтобы понимать размерность:

![raspberry-size](https://static.juev.org/2020/06/rasp02.jpeg)

В собранном состоянии:

![raspberry-full01](https://static.juev.org/2020/06/rasp03.jpeg)

Немного другой ракурс:

![raspberry-full02](https://static.juev.org/2020/06/rasp04.jpeg)

Собирать малинку было просто, на все потратил порядка 15 минут. Чуть больше готовил SD-карту, когда записывал образ Raspberry. Для того, чтобы настроить малинку на работу необходимо после записи образа снова подключить SD-карту к компьютеру и в разделе `/Volumes/boot` создать два файла:

1. пустой файл ssh для активации ssh-сервиса при старте малинки
1. файл `wpa_supplicant.conf` с описанием подключения к wifi-сети (документация представлена на официальной странице [headless](https://www.raspberrypi.org/documentation/configuration/wireless/headless.md))

После включения малинки в сеть она оказывается доступной для подключения в сети:

```bash
ssh pi@raspberrypi.local
```

## Описание проблемы

Дома у меня подключение к интернету от провайдера МГТС на скорости 200 мегабит в секунду. При этом дома раздается интернет по WiFi через их роутер ZTE F670. При использовании подключения к WiFi на частоте 5Ghz получаю стабильные 200 мегабит на своих устройствах.

Проблема заключается в том, что подключиться на частоте 5Ghz на малинке мне не удалось. Сканирование сети показывало наличие SSID только в сети с частотой 2.4Ghz. Что довольно странно, так как в документации явно говориться о поддержке всех частот.

В интернетах нашел упоминание о том, что настройке беспроводной сети для малинки 4-й версии нужно явно указывать страну, в которой работает беспроводная сеть. От этого зависит, какие частоты будут использоваться для подключения к сети в 5Ghz. И так же указывалось, что в ряде стран 5Ghz просто отключается. В качестве решения предлагалось выставить явно страну в `US` или `GB`, где поддержка присутствует. Попытался менять файл `wpa_supplicant.conf`, указывая эти страны, что приводило к тому, что при сканировании начинали появляться сети с 5Ghz, но подключится к ним было невозможно.

На одном из форумов так же указывали, что если использовать не официальный дистрибутив raspberrypi, который основан на Debian, а Ubuntu, то проблем с сетью нет. Залил Ubuntu на SD-карту, загрузился, подключение к WiFi прошло успешно и работало стабильно в сети 5Ghz. Все бы хорошо. Только Ubuntu как был странным дистрибутивом, так им и остался.

Использовать малинку я собирался в основном в двух вещах:

1. [pi-hole](https://pi-hole.net/)
1. [nextcloud](https://nextcloud.com/)

Блокировка рекламы и сетевой диск. Как раз с первым в Ubuntu у меня возникли проблемы. При установке pi-hole в режиме docker, контейнер не стартовал, указывая на то, что порт 53 уже занят другим процессом. Это связано с тем, что на 53 порту висит по умолчанию `systemd-resolved`, локальный резволвер, который для десктопа дает массу преимуществ, но сильно мешает на сервере. А при установке pi-hole в режиме приложения, производиться отключение указанного сервиса, с последующими проблемами при использовании системы.

Не больше одного дня меня хватило на Ubuntu, после чего удалил ее и вернулся к Debian. Пусть медленнее, но работает безо всех этих проблем.

## Решение проблемы с подключением

После установки Debian решил потратить чуть больше времени на анализ проблемы. Изначально настроил подключение на использование сети 2,4Ghz с гарантированным подключением. В параметрах подключения указывал `RU`. Для просмотра текущих параметров работы беспроводной сети использовал команды:

```bash
pi@raspberrypi:~ $ sudo iw reg get
global
country RU: DFS-ETSI
    (2402 - 2482 @ 40), (N/A, 20), (N/A)
    (5170 - 5250 @ 80), (N/A, 20), (N/A), AUTO-BW
    (5250 - 5330 @ 80), (N/A, 20), (0 ms), DFS, AUTO-BW
    (5650 - 5730 @ 80), (N/A, 30), (0 ms), DFS
    (5735 - 5835 @ 80), (N/A, 30), (N/A)
    (57000 - 66000 @ 2160), (N/A, 40), (N/A)
```

Видно, что настроено на использование именно российских каналов. Теперь смотрим список доступных каналов:

```bash
pi@raspberrypi:~ $ iw list
Wiphy phy0
    max # scan SSIDs: 10
    max scan IEs length: 2048 bytes
    max # sched scan SSIDs: 16
    max # match sets: 16
    max # scan plans: 1
    max scan plan interval: 508
    max scan plan iterations: 0
    Retry short limit: 7
    Retry long limit: 4
    Coverage class: 0 (up to 0m)
    Device supports roaming.
    Device supports T-DLS.
    Supported Ciphers:
        ,* WEP40 (00-0f-ac:1)
        ,* WEP104 (00-0f-ac:5)
        ,* TKIP (00-0f-ac:2)
        ,* CCMP-128 (00-0f-ac:4)
        ,* CMAC (00-0f-ac:6)
    Available Antennas: TX 0 RX 0
    Supported interface modes:
         ,* IBSS
         ,* managed
         ,* AP
         ,* P2P-client
         ,* P2P-GO
         ,* P2P-device
    Band 1:
        Capabilities: 0x1062
            HT20/HT40
            Static SM Power Save
            RX HT20 SGI
            RX HT40 SGI
            No RX STBC
            Max AMSDU length: 3839 bytes
            DSSS/CCK HT40
        Maximum RX AMPDU length 65535 bytes (exponent: 0x003)
        Minimum RX AMPDU time spacing: 16 usec (0x07)
        HT TX/RX MCS rate indexes supported: 0-7
        Bitrates (non-HT):
            ,* 1.0 Mbps
            ,* 2.0 Mbps (short preamble supported)
            ,* 5.5 Mbps (short preamble supported)
            ,* 11.0 Mbps (short preamble supported)
            ,* 6.0 Mbps
            ,* 9.0 Mbps
            ,* 12.0 Mbps
            ,* 18.0 Mbps
            ,* 24.0 Mbps
            ,* 36.0 Mbps
            ,* 48.0 Mbps
            ,* 54.0 Mbps
        Frequencies:
            ,* 2412 MHz [1] (20.0 dBm)
            ,* 2417 MHz [2] (20.0 dBm)
            ,* 2422 MHz [3] (20.0 dBm)
            ,* 2427 MHz [4] (20.0 dBm)
            ,* 2432 MHz [5] (20.0 dBm)
            ,* 2437 MHz [6] (20.0 dBm)
            ,* 2442 MHz [7] (20.0 dBm)
            ,* 2447 MHz [8] (20.0 dBm)
            ,* 2452 MHz [9] (20.0 dBm)
            ,* 2457 MHz [10] (20.0 dBm)
            ,* 2462 MHz [11] (20.0 dBm)
            ,* 2467 MHz [12] (20.0 dBm)
            ,* 2472 MHz [13] (20.0 dBm)
            ,* 2484 MHz [14] (disabled)
    Band 2:
        Capabilities: 0x1062
            HT20/HT40
            Static SM Power Save
            RX HT20 SGI
            RX HT40 SGI
            No RX STBC
            Max AMSDU length: 3839 bytes
            DSSS/CCK HT40
        Maximum RX AMPDU length 65535 bytes (exponent: 0x003)
        Minimum RX AMPDU time spacing: 16 usec (0x07)
        HT TX/RX MCS rate indexes supported: 0-7
        VHT Capabilities (0x00001020):
            Max MPDU length: 3895
            Supported Channel Width: neither 160 nor 80+80
            short GI (80 MHz)
            SU Beamformee
        VHT RX MCS set:
            1 streams: MCS 0-9
            2 streams: not supported
            3 streams: not supported
            4 streams: not supported
            5 streams: not supported
            6 streams: not supported
            7 streams: not supported
            8 streams: not supported
        VHT RX highest supported: 0 Mbps
        VHT TX MCS set:
            1 streams: MCS 0-9
            2 streams: not supported
            3 streams: not supported
            4 streams: not supported
            5 streams: not supported
            6 streams: not supported
            7 streams: not supported
            8 streams: not supported
        VHT TX highest supported: 0 Mbps
        Bitrates (non-HT):
            ,* 6.0 Mbps
            ,* 9.0 Mbps
            ,* 12.0 Mbps
            ,* 18.0 Mbps
            ,* 24.0 Mbps
            ,* 36.0 Mbps
            ,* 48.0 Mbps
            ,* 54.0 Mbps
        Frequencies:
            ,* 5170 MHz [34] (disabled)
            ,* 5180 MHz [36] (disabled)
            ,* 5190 MHz [38] (disabled)
            ,* 5200 MHz [40] (disabled)
            ,* 5210 MHz [42] (disabled)
            ,* 5220 MHz [44] (disabled)
            ,* 5230 MHz [46] (disabled)
            ,* 5240 MHz [48] (disabled)
            ,* 5260 MHz [52] (disabled)
            ,* 5280 MHz [56] (disabled)
            ,* 5300 MHz [60] (disabled)
            ,* 5320 MHz [64] (disabled)
            ,* 5500 MHz [100] (disabled)
            ,* 5520 MHz [104] (disabled)
            ,* 5540 MHz [108] (disabled)
            ,* 5560 MHz [112] (disabled)
            ,* 5580 MHz [116] (disabled)
            ,* 5600 MHz [120] (disabled)
            ,* 5620 MHz [124] (disabled)
            ,* 5640 MHz [128] (disabled)
            ,* 5660 MHz [132] (disabled)
            ,* 5680 MHz [136] (disabled)
            ,* 5700 MHz [140] (disabled)
            ,* 5720 MHz [144] (disabled)
            ,* 5745 MHz [149] (disabled)
            ,* 5765 MHz [153] (disabled)
            ,* 5785 MHz [157] (disabled)
            ,* 5805 MHz [161] (disabled)
            ,* 5825 MHz [165] (disabled)
    Supported commands:
         ,* new_interface
         ,* set_interface
         ,* new_key
         ,* start_ap
         ,* join_ibss
         ,* set_pmksa
         ,* del_pmksa
         ,* flush_pmksa
         ,* remain_on_channel
         ,* frame
         ,* set_wiphy_netns
         ,* set_channel
         ,* tdls_oper
         ,* start_sched_scan
         ,* start_p2p_device
         ,* connect
         ,* disconnect
         ,* crit_protocol_start
         ,* crit_protocol_stop
         ,* update_connect_params
    Supported TX frame types:
         ,* managed: 0x00 0x10 0x20 0x30 0x40 0x50 0x60 0x70 0x80 0x90 0xa0 0xb0 0xc0 0xd0 0xe0 0xf0
         ,* AP: 0x00 0x10 0x20 0x30 0x40 0x50 0x60 0x70 0x80 0x90 0xa0 0xb0 0xc0 0xd0 0xe0 0xf0
         ,* P2P-client: 0x00 0x10 0x20 0x30 0x40 0x50 0x60 0x70 0x80 0x90 0xa0 0xb0 0xc0 0xd0 0xe0 0xf0
         ,* P2P-GO: 0x00 0x10 0x20 0x30 0x40 0x50 0x60 0x70 0x80 0x90 0xa0 0xb0 0xc0 0xd0 0xe0 0xf0
         ,* P2P-device: 0x00 0x10 0x20 0x30 0x40 0x50 0x60 0x70 0x80 0x90 0xa0 0xb0 0xc0 0xd0 0xe0 0xf0
    Supported RX frame types:
         ,* managed: 0x40 0xd0
         ,* AP: 0x00 0x20 0x40 0xa0 0xb0 0xc0 0xd0
         ,* P2P-client: 0x40 0xd0
         ,* P2P-GO: 0x00 0x20 0x40 0xa0 0xb0 0xc0 0xd0
         ,* P2P-device: 0x40 0xd0
    software interface modes (can always be added):
    valid interface combinations:
         ,* #{ managed } <= 1, #{ P2P-device } <= 1, #{ P2P-client, P2P-GO } <= 1,
           total <= 3, #channels <= 2
         ,* #{ managed } <= 1, #{ AP } <= 1, #{ P2P-client } <= 1, #{ P2P-device } <= 1,
           total <= 4, #channels <= 1
    Device supports scan flush.
    Device supports randomizing MAC-addr in sched scans.
    Supported extended features:
        ,* [ 4WAY_HANDSHAKE_STA_PSK ]: 4-way handshake with PSK in station mode
        ,* [ 4WAY_HANDSHAKE_STA_1X ]: 4-way handshake with 802.1X in station mode
```

Обращаем внимание на то, что напротив 5Ghz каналов стоит `disabled`. То есть при использовании `RU` эти каналы просто отключаются. Пробуем переключить на лету страну:

```bash
pi@raspberrypi:~ $ sudo iw reg set US
pi@raspberrypi:~ $ sudo iw reg get
global
country 98: DFS-UNSET
    (2402 - 2472 @ 40), (N/A, 20), (N/A)
    (5170 - 5250 @ 80), (N/A, 20), (N/A), AUTO-BW
    (5250 - 5330 @ 80), (N/A, 20), (0 ms), DFS, AUTO-BW
    (5650 - 5730 @ 80), (N/A, 23), (0 ms), DFS
    (5735 - 5835 @ 80), (N/A, 30), (N/A)
    (57240 - 63720 @ 2160), (N/A, 40), (N/A)
```

Видно, что режим переключился, осталось проверить, что у нас с каналами?

```bash
pi@raspberrypi:~ $ iw phy phy0 channels
Band 1:
    ,* 2412 MHz [1]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz HT40+
    ,* 2417 MHz [2]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz HT40+
    ,* 2422 MHz [3]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz HT40+
    ,* 2427 MHz [4]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz HT40+
    ,* 2432 MHz [5]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz HT40- HT40+
    ,* 2437 MHz [6]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz HT40- HT40+
    ,* 2442 MHz [7]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz HT40- HT40+
    ,* 2447 MHz [8]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz HT40-
    ,* 2452 MHz [9]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz HT40-
    ,* 2457 MHz [10]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz HT40-
    ,* 2462 MHz [11]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz HT40-
    ,* 2467 MHz [12] (disabled)
    ,* 2472 MHz [13] (disabled)
    ,* 2484 MHz [14] (disabled)
Band 2:
    ,* 5170 MHz [34] (disabled)
    ,* 5180 MHz [36]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz HT40+ VHT80
    ,* 5190 MHz [38] (disabled)
    ,* 5200 MHz [40]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz HT40- VHT80
    ,* 5210 MHz [42] (disabled)
    ,* 5220 MHz [44]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz HT40+ VHT80
    ,* 5230 MHz [46] (disabled)
    ,* 5240 MHz [48]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz HT40- VHT80
    ,* 5260 MHz [52]
      Maximum TX power: 20.0 dBm
      No IR
      Radar detection
      Channel widths: 20MHz HT40+ VHT80
      DFS state: usable (for 11 sec)
      DFS CAC time: 60000 ms
    ,* 5280 MHz [56]
      Maximum TX power: 20.0 dBm
      No IR
      Radar detection
      Channel widths: 20MHz HT40- VHT80
      DFS state: usable (for 11 sec)
      DFS CAC time: 60000 ms
    ,* 5300 MHz [60]
      Maximum TX power: 20.0 dBm
      No IR
      Radar detection
      Channel widths: 20MHz HT40+ VHT80
      DFS state: usable (for 11 sec)
      DFS CAC time: 60000 ms
    ,* 5320 MHz [64]
      Maximum TX power: 20.0 dBm
      No IR
      Radar detection
      Channel widths: 20MHz HT40- VHT80
      DFS state: usable (for 11 sec)
      DFS CAC time: 60000 ms
    ,* 5500 MHz [100]
      Maximum TX power: 20.0 dBm
      No IR
      Radar detection
      Channel widths: 20MHz HT40+ VHT80
      DFS state: usable (for 675 sec)
      DFS CAC time: 60000 ms
    ,* 5520 MHz [104]
      Maximum TX power: 20.0 dBm
      No IR
      Radar detection
      Channel widths: 20MHz HT40- VHT80
      DFS state: usable (for 675 sec)
      DFS CAC time: 60000 ms
    ,* 5540 MHz [108]
      Maximum TX power: 20.0 dBm
      No IR
      Radar detection
      Channel widths: 20MHz HT40+ VHT80
      DFS state: usable (for 675 sec)
      DFS CAC time: 60000 ms
    ,* 5560 MHz [112]
      Maximum TX power: 20.0 dBm
      No IR
      Radar detection
      Channel widths: 20MHz HT40- VHT80
      DFS state: usable (for 675 sec)
      DFS CAC time: 60000 ms
    ,* 5580 MHz [116]
      Maximum TX power: 20.0 dBm
      No IR
      Radar detection
      Channel widths: 20MHz HT40+ VHT80
      DFS state: usable (for 675 sec)
      DFS CAC time: 60000 ms
    ,* 5600 MHz [120]
      Maximum TX power: 20.0 dBm
      No IR
      Radar detection
      Channel widths: 20MHz HT40- VHT80
      DFS state: usable (for 675 sec)
      DFS CAC time: 60000 ms
    ,* 5620 MHz [124]
      Maximum TX power: 20.0 dBm
      No IR
      Radar detection
      Channel widths: 20MHz HT40+ VHT80
      DFS state: usable (for 675 sec)
      DFS CAC time: 60000 ms
    ,* 5640 MHz [128]
      Maximum TX power: 20.0 dBm
      No IR
      Radar detection
      Channel widths: 20MHz HT40- VHT80
      DFS state: usable (for 675 sec)
      DFS CAC time: 60000 ms
    ,* 5660 MHz [132]
      Maximum TX power: 20.0 dBm
      No IR
      Radar detection
      Channel widths: 20MHz HT40+ VHT80
      DFS state: usable (for 11 sec)
      DFS CAC time: 60000 ms
    ,* 5680 MHz [136]
      Maximum TX power: 20.0 dBm
      No IR
      Radar detection
      Channel widths: 20MHz HT40- VHT80
      DFS state: usable (for 11 sec)
      DFS CAC time: 60000 ms
    ,* 5700 MHz [140]
      Maximum TX power: 20.0 dBm
      No IR
      Radar detection
      Channel widths: 20MHz HT40+ VHT80
      DFS state: usable (for 11 sec)
      DFS CAC time: 60000 ms
    ,* 5720 MHz [144]
      Maximum TX power: 20.0 dBm
      No IR
      Radar detection
      Channel widths: 20MHz HT40- VHT80
      DFS state: usable (for 11 sec)
      DFS CAC time: 60000 ms
    ,* 5745 MHz [149]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz HT40+ VHT80
    ,* 5765 MHz [153]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz HT40- VHT80
    ,* 5785 MHz [157]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz HT40+ VHT80
    ,* 5805 MHz [161]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz HT40- VHT80
    ,* 5825 MHz [165]
      Maximum TX power: 20.0 dBm
      Channel widths: 20MHz
```

Совершенно другое дело! 5Ghz каналы включены. Отлично! То есть нужно переключить страну в параметрах wifi и дело с концом? Пробуем изменить в файле `/etc/wpa_supplicant/wpa_supplicant.conf` страну и на `US` и на лету подгрузить новые настройки с помощью команды:

```bash
sudo wpa_cli -i wlan0 reconfigure
```

Проверяем что получилось:

```bash
pi@raspberrypi:~ $ sudo iw reg get
global
country RU: DFS-ETSI
    (2402 - 2482 @ 40), (N/A, 20), (N/A)
    (5170 - 5250 @ 80), (N/A, 20), (N/A), AUTO-BW
    (5250 - 5330 @ 80), (N/A, 20), (0 ms), DFS, AUTO-BW
    (5650 - 5730 @ 80), (N/A, 30), (0 ms), DFS
    (5735 - 5835 @ 80), (N/A, 30), (N/A)
    (57000 - 66000 @ 2160), (N/A, 40), (N/A)
```

С удивлением наблюдаем, что снова используется `RU`, хотя выставляли другую страну и список каналов снова указывает на то, что 5Ghz отключены. Для чистоты эксперимента отключаю малинку, создаю снова файл `wpa_supplicant.conf` в `/boot`директории на SD с указанием `US` страны. После загрузки проверяю и снова вижу, что изменение страны в параметрах подключения не играет роли, снова используется Россия и снова 5Ghz отключены.

Остается вариант изменения параметров работы роутера. В парметрах ZTE F670 в подключении wifi указываю вместо России Соединенные штаты, перезагружаю роутер и ничего не трогая в малинке, просто проверяю, как обстоят дела с подключением на ней:

```bash
pi@raspberrypi:~ $ sudo iw reg get
global
country 98: DFS-UNSET
    (2402 - 2472 @ 40), (N/A, 20), (N/A)
    (5170 - 5250 @ 80), (N/A, 20), (N/A), AUTO-BW
    (5250 - 5330 @ 80), (N/A, 20), (0 ms), DFS, AUTO-BW
    (5650 - 5730 @ 80), (N/A, 23), (0 ms), DFS
    (5735 - 5835 @ 80), (N/A, 30), (N/A)
    (57240 - 63720 @ 2160), (N/A, 40), (N/A)
```

Получилось! Страна в подключении на малинке изменилась на `US` и в списке каналов фигурируют 5Ghz, просмотр SSID-сетей отображает все имеющиеся сети. Изменение подключения на SSID с 5Ghz успешно проходит и сохраняется после ребута малинки. Больше никаких проблем с подключением.

Как оказалось, в работе Raspberrypi с wifi важную роль играют не только настройки системы, но и настройки роутера, к которому производиться подключение.
