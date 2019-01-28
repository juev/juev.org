---
layout: post
title: Использование связки Nginx+Apache
keywords: nginx,apache,speed
date: 2010-09-07 00:00
tags:
- nginx
- apache
---
Недолго я баловался со связкой Nginx + PHP-Fpm, надоело мне возиться с rewrite. Довольно долго мучился с настройками rewrite для корректной работы расширения WP Super Cache, а пробовать в работе W3 Total Cache не представлялось возможным, так как сложность правил возрастает на порядок.

В конце концов решил вернуть на место Apache + mod\_php в качестве обработчика php-скриптов. И заодно интересно было бы сравнить производительность данной связки с чистым php-fpm.

Да, я уже пробовал данную связку, но, как оказалось, она была не совсем корректно настроена. Было не верно выбрано число дочерних процессов apache и не корректно настроена связка Nginx и apache. Что было проделано и какие результаты были получены?

На число процессов apache, а значит и на потребляемую память влияет параметр <em>MaxClients</em>. По умолчанию используется значение порядка 150. В случае чистого апача это имеет смысл, создавать отдельный процесс для отдачи на каждый запрос, но памяти при этом используется очень много.

В случае же использования Nginx в качестве фронтэнда, когда вся статика отдается Nginx, и он же контролирует входящие соединения, можно данное значение уменьшить. И очень значительно! Я оставил 4 возможных клиента. И как показала практика, этого пока вполне достаточно.

Редактируем файл <code>/etc/apache2/apache2</code>, меняем параметры префорк-модуля и отключаем <em>KeepAlive</em>:

    <IfModule mpm_prefork_module>
        StartServers          1
        MinSpareServers       1
        MaxSpareServers       4
        MaxClients            4
        MaxRequestsPerChild   1000
    </IfModule>
    KeepAlive Off

Отключать <em>KeepAlive</em> строго обязательно, так как между <em>Nginx</em> и <em>Apache</em> соединения держать просто не имеет смысла. И куда эффективнее их сбрасывать для того, чтобы данный процесс мог тут же получать новое задание на обработку php-скрипта.

Параметр <code>MaxRequestsPerChild</code> установлен в 1000, для того, чтобы после обработки тысячи запросов происходил перезапуск процесса, с целью высвобождения занятой памяти.

Для виртуального хоста создаем примерно следующую конфигурацию, создав файл <code>/etc/apache2/sites-available/juev.ru</code> и затем создав на него символическую ссылку в каталог <code>/etc/apache2/sites-enabled</code>:

    <VirtualHost *>
           ServerName juev.ru
           ServerAdmin webmaster@gmail.com
           ServerAlias www.juev.ru juev.ru
           DocumentRoot /var/www/juev.ru/web
           SuexecUserGroup www-data www-data
           <Directory /var/www/juev.ru/web>
                    Options FollowSymLinks
                    Options -MultiViews
                    Options -Indexes
                    AllowOverride All
                    Order allow,deny
                    allow from all
           </Directory>
           CustomLog /var/www/juev.ru/log/access.log combined
           ErrorLog /var/www/juev.ru/log/error.log
           AddDefaultCharset utf-8
    </VirtualHost>

Пару дней сервер проработал со включенной опцией <code>MultiViews</code>. Я еще удивлялся, почему не работает страница SiteMap, просто не показывалась Карта Сайта. Оказалось, что именно эта опция позволят использовать в качестве адресов очень похожие значения. И вместо использования sitemap, сервер пытался обратиться к файлу sitemap.xml.gz. Проблема была решена только после отключения данного параметра.

Теперь указываем на использование Apache только в качестве локального сервера, для этого изменяем файл <code>/etc/apache2/ports.conf</code>:

    NameVirtualHost *
    Listen 127.0.0.1:8080

Apache настроен, перезапускаем его:

    # service apache2 restart

Остается настроить Nginx. Приводим файл <code>/etc/nginx/nginx.conf</code> к следующему виду:

    user www-data;
    worker_processes  1;

    error_log  /var/log/nginx/error.log;
    pid        /var/run/nginx.pid;

    events {
        worker_connections  1024;
        use epoll;
    }

    http {
        include       /etc/nginx/mime.types;
        access_log  /var/log/nginx/access.log;
        sendfile        on;
        keepalive_timeout   4;
        tcp_nodelay        on;

        client_max_body_size 100m;

        gzip on;
        gzip_min_length 1024;
        gzip_comp_level 5;
        gzip_static on;
        gzip_disable "MSIE [1-6]\.(?!.*SV1)";

        include /etc/nginx/conf.d/*.conf;
        include /etc/nginx/sites-enabled/*;
    }

И теперь настраиваем виртуальный хост, для чего создаем файл <code>/etc/nginx/sites-available/juev.ru</code> и затем создаем на него символическую ссылку в каталог <code>/etc/nginx/sites-enabled</code>:

    server {
            listen   80;
            server_name  juev.ru www.juev.ru;
            root   /var/www/juev.ru/web;

            server_name_in_redirect off;

            index  index.php index.html index.htm;
            access_log  /var/www/juev.ru/log/access.log;

            error_page   500 502 503 504  /50x.html;
            location = /50x.html {
                    root   /var/www/nginx-default;
            }

            location / {
                    proxy_set_header X-Real-IP  $remote_addr;
                    proxy_set_header Host $host;
                    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                    proxy_pass http://127.0.0.1:8080; # Apache listening
            }

            location ~* ^.+\.(jpg|jpeg|gif|png|ico|css|zip|tgz|gz|rar|bz2|doc|xls|exe|pdf|ppt|txt|tar|wav|bmp|rtf|js)$ {
                    root   /var/www/juev.ru/web;
                    access_log off;
                    expires 30d;
            }

            location ~ /\.ht {
                    deny  all;
            }
    }

    server {
            server_name static.juev.ru;

            if ($request_uri !~* "\.(jpe?g|gif|css|png|js|ico|pdf|zip|gz)$") {
                    rewrite ^(.*) http://www.juev.ru$1 permanent;
                    break;
            }

            location / {
                    root   /var/www/juev.ru/web/wordpress/wp-content/uploads/;
                    access_log off;
                    expires max;
                    add_header Cache-Control private;
            }
    }

Как видно из приведенного кода, прописано два хоста. Первый соответствует главному домену, а второй создан для отдачи медиа-файлов из поддомена, как было описано в статье <a href="/2010/08/29/wordpress-store-images-in-a-subdomain/">WordPress: store images in a subdomain</a>.

Перезапускаем Nginx:

    # /etc/init.d/nginx restart

И проверяем сервер в работе. Что самое интересное, apache потребляет меньше оперативной памяти, чем использовалось процессами php5-fpm. При этом, как показал стресс-тест сервера, число одновременно обрабатываемых запросов осталось на прежнем уровне (~20 запросов в секунду).

При этом теперь нет проблем с использованием rewrite, расширения самостоятельно создают нужную им конфигурацию.
