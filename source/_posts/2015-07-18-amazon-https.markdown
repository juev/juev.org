---
layout: post
title: "Использование HTTPS на серверах Амазона"
date: 2015-07-18 15:56
image: https://static.juev.org/2015/07/general.png
tags:
  - web
  - security
  - amazon
---
Решил на своей визитке [denis.evsyukov.org](https://denis.evsyukov.org "Denis Evsyukov") настроить протокол HTTPS.

## Получение сертификата

Можно получить сертификат бесплатно, с помощью [startssl.com](https://www.startssl.com "StartSLL"). Да, он бесплатный, но для его изменения или отзыва потребуется заплатить и стоимость начинается от $25. То есть, если вы ошибетесь при генерации сертификата для своего домена, исправить бесплатно будет уже невозможно. При этом столкнулся с тем, что сам выдаваемый сертификат использует уже устаревшую SSL-1, что приводит к ряду предупреждений при посещении сайта.

Я решил воспользоваться услугами [www.namecheap.com](https://www.namecheap.com "NameCheep"), небольшой интернет-магазин доменных имен и сертификатов различных уровней. PositiveSSL от Comodo стоит у них всего $9 за год. В то время как на офсайте Comodo тот же самый сертификат стоит $76.95 за год. Стоит отметить тот факт, что при регистрации сертификата в namecheep, вся коммуникация проходит с серверами именно Comodo, то есть сертификат выдает именно Comodo.

Сертификат PositiveSSL привязывается к одному домену, и его поддомену c www. Для регистрации нам потребуется сгенерировать новые ключи, которые в дальнейшем будем передавать регистратору.

``` bash
$ mkdir /tmp/ssl
$ cd /tmp/ssl
$ openssl req -sha256 -new -newkey rsa:2048 -nodes -keyout private.key -out domain.csr
Country Name (2 letter code) [AU]:RU
State or Province Name (full name) [Some-State]:Samara
Locality Name (eg, city) []:Togliatty
Organization Name (eg, company) [Internet Widgits Pty Ltd]:Denis Evsyukov
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:denis.evsyukov.org
Email Address []:

Please enter the following 'extra' attributes
to be sent with your certificate request
A challenge password []:
An optional company name []:
```

Поле обязательное для заполнения -- `Common Name`, в котором указывается домен, на который будет проводиться регистрация. Размер ключа должен быть строго 2048 байт, меньше не допускается требованиями безопансности, а больше уже не принимает Amazon.

Содержимое файла `domain.csr` используем при запросе сертификата на сайте namecheep. При прохождении процедуры регистрации, не важно, первый раз вы запрашиваете сертификат или повторно, требуется подтверждать свое право на владение доменом. Осуществляется это с помощью отправки случайного кода на один из административных адресов электронной почты данного домена. После подтверждения спустя несколько минут уже на ваш электронный адрес приходит письмо с zip-архивом сертификата.

## Установка сертификата на домен

В Amazon есть только два сервиса, позволяющих задавать сертификаты для обмена данными: это Elastic Load Balancer и Cloudfront. Привязать сертификат к статическому сайту, размещенному в S3 без использования перечисленных сервисов не получиться. Так как моя визитка уже была размещена в Cloudfront, проблем я не испытал.

Первое, что потребуется сделать, это установить консольное приложение для управления сервисами amazon, сделать это можно несколькими способами, описанными на [странице документации](http://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-set-up.html "AWS Documentation"), я воспользовался установкой с помощью пакетного менеджера питона:

``` bash
$ sudo pip install --upgrade awscli
```

Теперь распаковываем полученный чуть ранее архив с сертификатом во временную директорию, и туда же копируем свой `private.key`:

``` bash
$ ls -1
AddTrustExternalCARoot.crt
COMODORSAAddTrustCA.crt
COMODORSADomainValidationSecureServerCA.crt
denis_evsyukov_org.crt
private.key
```

Для загрузки на сертификата на сервер амазона, нам потребуется объединить первые три файла в один:

``` bash
$ cat COMODORSADomainValidationSecureServerCA.crt COMODORSAAddTrustCA.crt AddTrustExternalCARoot.crt > PositiveSSL.ca-bundle
```

Для загрузки сертификата невозможно использовать пользователя с правами root, который по умолчанию создается при регистрации в сервисе. Необходимо с использованием IAM завести дополнительного пользователя и предоставить ему права для работы с сервисом Cloudfront. После регистрации авторизируемся с использованием учетных данных нового пользователя:

``` bash
$ aws configure
```

И наконец загружаем ссертификат:

``` bash
$ aws iam upload-server-certificate --server-certificate-name DenisEvsyukovOrg --certificate-body file://denis_evsyukov_org.crt --private-key file://private.key --certificate-chain file://PositiveSSL.ca-bundle --path /cloudfront/
```

Имя загружаемого сертификата выбраем произвольное.

## Настройка Cloudfront

После загрузки, переходим в веб-интерфейс консоли управления сервисами амазона, и выбираем Cloudfront. Выбираем требуемый Distribution и на вкладке General редактируем поле сертификата:

[![general](https://static.juev.org/2015/07/general.png)](https://static.juev.org/2015/07/general.png "General")

Выбираем сертификат, что загрузили ранее. После чего сохраняем результат и переходим на вкладку Behavior, где задаем редирект с http на https:

[![behavior](https://static.juev.org/2015/07/behavior.png)](https://static.juev.org/2015/07/behavior.png "Behavior")

Для того, чтобы изменения вступили в силу, необходимо провести инвалидацию объектов на соответствующей вкладке. Спустя 10-15 минут можно проверять результат: [SSL Report](https://www.ssllabs.com/ssltest/analyze.html?d=denis.evsyukov.org "SSL Report").
