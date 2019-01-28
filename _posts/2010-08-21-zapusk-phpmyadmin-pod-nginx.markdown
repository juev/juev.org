---
layout: post
title: Запуск phpmyadmin под Nginx
keywords: nginx,phpmyadmin,vps
date: 2010-08-21 00:00
tags:
- nginx
- vps
---
После перехода на использование чистого Nginx на сервере, столкнулся с неожиданной проблемой неработоспособности phpmyadmin. По сути все правильно, ведь при установке проводиться только конфигурация веб-сервера Apache, и сам Nginx ничего не знает о существовании данной утилиты.

Довольно долго искал работоспособную конфигурацию, наконец нашел и спешу поделиться с вами.

Оказалось все довольно просто, даже обидно, честное слово. Создаем отдельный поддомен в
nginx. Для этого создаем отдельный файл `/etc/nginx/sites-available/phpmyadmin.domain.ru`. Где, как вы помните, имя файла может быть любым, но принято его называть по имени выбранного домена. И прописываем в нем следующее:

    server {
            listen   80;
            server_name  phpmyadmin.domain.ru;

            access_log  /var/log/nginx/phpmyadmin.domain.ru.access.log;

            location / {
                    root /usr/share/phpmyadmin;
                    index index.php;
            }

            location ~ \.php$ {
                    fastcgi_pass   127.0.0.1:9000;
                    fastcgi_index  index.php;
                    fastcgi_param  SCRIPT_FILENAME  /usr/share/phpmyadmin$fastcgi_script_name;
                    include fastcgi_params;
            }
    }

Не забываем про уже работающие процессы php-fpm, про которые я описывал в статье <a href="/2010/08/21/nginx-wordpress-in-ubuntu-10-04/">Nginx &amp; WordPress в Ubuntu 10.04</a>.

Теперь запускаем новый сайт, для чего даем следующие команды:

    # ln -s /etc/nginx/sites-available/phpmyadmin.domain.ru /etc/nginx/sites-enabled/phpmyadmin.domain.ru
    # /etc/init.d/nginx reload

И теперь можно работать с myphpadmin, обратившись по адресу phpmyadmin.domain.ru!
