---
title: "Хостинг сайтов с помощью Cloudflare tunnel"
date: 2022-02-13T10:32:35+0300
image: https://static.juev.org/2022/02/cloudflare-banner.png
tags: 
  - cloudflare
  - web
  - raspberrypi
---

Иногда возникают задачи по размещению серверов в частных сетях, которые по разным причинам могут быть недоступны в сети Интернет. Простейший пример -- размещение общедоступного сайта в домашних условиях на Raspberry Pi.

Для приватного доступа очень удобно использовать [Tailscale](https://tailscale.com). Но если нужно организовать именно общедоступный доступ, то остается только один вариант -- [Cloudflare](https://www.cloudflare.com).

При этом размещать свою dns-зону нужно будет в Cloudflare.

![](https://static.juev.org/2022/02/cloudflare-banner.png)

## Подготовка к работе

Во-первых, на сервере необходимо установить `cloudflared`. В [официальной документации](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide) все подробно описано, и сводиться к загрузке файла и его установки. Пример для Debian:

```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb 
sudo dpkg -i cloudflared-linux-amd64.deb
```

Для установки на малинке нужно загружать бинарник и размещать его в доступной директории, для примера:

```bash
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm
sudo mv cloudlfared-linux-arm /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared
```

Во-вторых, проводим аутентификацию:

```bash
cloudflared tunnel login
```

Нам предоставят ссылку на страницу, по которой необходимо перейти в браузере, авторизоваться и на странице выбираем требуемый домен и получаем уведомление, что авторизация клиента успешная. Закрываем страницу.

## Создание туннеля

Создаем туннель, для примера `juevorg`:

```bash
cloudflared tunnel create juevorg
```

После создания туннеля мы получаем информацию об ID созданного туннеля и о новом json-файле, содержащем данные аутентификации:

```bash
pi@raspberrypi:~$ cloudflared tunnel create juevorg
Tunnel credentials written to /home/pi/.cloudflared/dbe98e0d-6435-4dff-af22-fc8205a0b1f1.json. cloudflared chose this file based on where your origin certificate was found. Keep this file secret. To revoke these credentials, delete the tunnel.

Created tunnel juevorg with id dbe98e0d-6435-4dff-af22-fc8205a0b1f1
```

Уже сейчас можно проводить запуск туннеля, но мы создадим системный сервис для управления:

```bash
sudo mkdir -p /etc/cloudflared
sudo vim /etc/cloudflared/config.yml
```

Предполагается, что на данный момент времени у вас на сервере уже размещается веб-сервер, который работает, для примера, на 80 порту. В пустой файл вставляем содержимое, на основе полученной ранее информации об ID туннеля и имени файла:

```plain
tunnel: dbe98e0d-6435-4dff-af22-fc8205a0b1f1 
credentials-file: /home/pi/.cloudflared/dbe98e0d-6435-4dff-af22-fc8205a0b1f1.json
ingress:
  - hostname: tst.juev.org
    service: http://localhost:80
  - service: http_status:404
```

В разделе `ingress` описываются все сервисы, которые должны быть доступны. Проводим инициализацию сервиса и его запуск:

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

Для просмотра логов сервиса использовать команду:

```bash
sudo journalctl -u cloudflared
```

Можно так же проверить статус созданного туннеля через команду:

```bash
cloudflared tunnel info juevorg
```

Итак туннель создан, теперь осталось направить в него запросы! Для этого есть два способа:

1. Используя приложение cloudflared. Просто используем команду

    ```bash
    cloudflared tunnel route dns juevorg tst.juev.org
    ``` 

2. Самостоятельно создать CNAME записи, указывающие на домены вида `myuuid.cfargotunnel.com`. К примеру, можно создать CNAME запись на `tst.juev.org`, который будет указывать на `dbe98e0d-6435-4dff-af22-fc8205a0b1f1.cfargotunnel.com`

Даем немного времени на обновление зоны и проверяем:

![](https://static.juev.org/2022/02/tst-juev.png)

Все работает! Работает с малинки, к которой нет доступа из интернета.

Нужно помнить, что для каждого созданного ингресса необходимо будет использовать отдельной поддомен. Рекомендую так же обратить свое внимание на [официальную документацию](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps), в которой есть описание различных кейсов.

