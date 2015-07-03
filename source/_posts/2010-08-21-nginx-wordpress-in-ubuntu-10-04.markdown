---
layout: post
title: Nginx &amp; WordPress в Ubuntu 10.04
keywords: nginx,wordpress,ubuntu
date: 2010-08-21 00:00
tags:
- nginx
- wordpress
- ubuntu
---
Продолжаю эксперименты на своем VPS, переносить текущий блог пока не готов, но думаю, в скором времени все будет.

Сегодня решил провести эксперимент по работе Nginx в качестве основного веб-сервера, без использования Apache. Сначала запутался с настройками, долго разбирался, почему же у меня ничего не работает. В конце концов разобрался.

Основная проблема, с которой приходиться сталкиваться любому человеку, желающему завести WordPress на Nginx -- это проблема связки самого веб-сервера с PHP.

Есть два варианта решения -- использование модуля <em>Spawn-fcgi</em> из комплекта
веб-сервера Lighttpd, либо использование <em>php-fpm</em>. Не знаю, почему, но я решил
остановиться на втором варианте. Кстати, для Ubuntu 10.04 установить его очень просто.
Достаточно лишь подключить репозиторий<a href="https://launchpad.net/~brianmercer/+archive/php/" rel="nofollow"> Brian's php5-fpm</a>. Для этого прописываем следующие адреса в файл <em>/etc/apt/sources.list</em>:

    deb http://ppa.launchpad.net/brianmercer/php/ubuntu lucid main
    deb-src http://ppa.launchpad.net/brianmercer/php/ubuntu lucid main

И затем импортируем ключ данного репозитория:

    $sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 8D0DC64F

Пришлось прописывать репозиторий руками, так как команды add-apt-repository в серверной убунте обнаружено не было.

Теперь устанавливаем нужный нам пакет и обновляем php, сразу же установим кэширующий модуль для php. Использовать будем <em>php5-xcache</em>, так как по производительности он не на много уступает eaccelerator, а вот устанавливается намного проще:

    #apt-get update
    #apt-get upgrade
    #apt-get install php5-fpm php5-xcache

Настройки <em>php</em> для данной реализации располагаются в файле <em>/etc/php5/fpm/php.ini</em>. Можно оставить все без изменения. По умолчанию выделяется 128 мегабайт оперативной памяти на каждый php-процесс. И запускается по умолчанию 10 процессов <em>php</em>.

Теперь нужно запустить <em>php-fpm</em> и приступать к организации связки nginx и php-fpm:

    #/etc/init.d/php5-fpm start

В основных настройках <em>Nginx</em> ничего не изменяем, можно только указать другое число процессов. Обычно рекомендуют число nginx-процессов устанавливать по числу ядер в процессоре. У меня на VPS используется 4-ядерный Xeon, потому поставил 4 процесса в настройках <em>Nginx</em>.

Теперь переходим к настройке отдельного сайта, который будет использовать в своей работе PHP. Создаем файл

    /etc/nginx/sites-available/domain.ru

Под domain.ru подразумевается домен, который будет использоваться сайтом. Данное имя файла используется только для того, чтобы в дальнейшем можно было быстрее найти настройки конкретного сайта, поэтому можете называть его как угодно, лишь бы вам было удобно. В приведенном примере сразу приводятся настройки для использования WordPress со включенным ЧПУ и плагина WP Super Cache. Переходим к  редактированию файла:

    server {
    listen   80;
    server_name  domain.ru;
    root   /var/www/domain.ru/web/wordpress;
    index  index.php;
    access_log  /var/log/nginx/localhost.access.log;
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /var/www/nginx-default;
    }
    location @wordpress {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME /var/www/domain.ru/web/wordpress/index.php;
        include fastcgi_params;
        fastcgi_param SCRIPT_NAME /index.php;
    }
    location ~ \.php$ {
        try_files $uri @wordpress;
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
    # deny access to .htaccess files, if Apache's document root
    # concurs with nginx's one
    #
    location ~ /\.ht {
        deny  all;
    }
    location / {
        # enable search for precompressed files ending in .gz
        # nginx needs to be complied using <80><93>-with-http_gzip_static_module
        # for this to work, comment out if using nginx from aptitude
        gzip_static on;
        try_files $uri $uri/ @wordpress;
        # if the requested file exists, return it immediately
        if (-f $request_filename) {
            break;
        }
        set $supercache_file '';
        set $supercache_uri $request_uri;
        if ($request_method = POST) {
            set $supercache_uri '';
        }
        # Using pretty permalinks, so bypass the cache for any query string
        if ($query_string) {
            set $supercache_uri '';
        }
        if ($http_cookie ~* "comment_author_|wordpress|wp-postpass_" ) {
            set $supercache_uri '';
        }
        # if we haven't bypassed the cache, specify our supercache file
        if ($supercache_uri ~ ^(.+)$) {
            set $supercache_file /wp-content/cache/supercache/$http_host/$1index.html;
        }
        # only rewrite to the supercache file if it actually exists
        if (-f $document_root$supercache_file) {
            rewrite ^(.*)$ $supercache_file break;
        }
        # all other requests go to Wordpress
        if (!-e $request_filename) {
            rewrite . /index.php last;
        }
    }
    }

Подразумевается, что папка wordpress лежит в корне сайта. Если это не так, то нужно немного подкорректировать пути в настройках сайта. Переводим сайт в режим работы:

    # ln -s /etc/nginx/sites-available/domain.ru /etc/nginx/sites-enabled/domain.ru

Теперь можно запускать <em>Nginx</em>:

    # /etc/init.d/nginx start

И переходить к установке и настройке WordPress. Единственное но: я не проводил тестирование установки вордпреса с данными настройками Nginx. Фактически я сначала только включил поддержку Fastcgi, установил WordPress и только после этого уже прописал в конфиге часть, отвечающую за rewrite. Обратите на это внимание!

Для корректного использования ЧПУ в WordPress под Nginx, нужно дополнительно установить
расширение WP под названием <a href="http://wordpress.org/extend/plugins/nginx-compatibility/" rel="nofollow">nginx Compatibility</a>.

Что могу сказать? Памяти стало использоваться больше, под кэш и буферы остается меньше места, чем было при использовании связки nginx+apache+php, так как используется большое количество php и nginx процессов. Однако скорость работы возросла очень значительно! Работать одно удовольствие!

Теперь попытаюсь найти способы тестирования сайта на нагрузку, провести эти тесты и сравнить с обычным апачем.

Ждите результатов!
