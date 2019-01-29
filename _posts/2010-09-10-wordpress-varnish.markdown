---
layout: post
title: Wordpress Speed Up
keywords: wordpress,varnish,speed,vps
date: 2010-09-10 00:00
tags:
- wordpress
- varnish
- vps
---
После того, как настроил свой сервер, немного успокоился и расслабился. Время отклика минимальное, нагрузка на процессор очень маленькая, уровень используемой памяти практически не изменяется и есть очень большой запас.

Что еще нужно для счастливой жизни? Ан нет, в последнее время все больше не давал покоя показатель уровня обрабатываемых запросов. Максимум, что удалось выжать это порядка 20 запросов в секунду. Сопоставляя с показаниями зарубежных блогеров, у которых на чистом apache были значения в 5-7 тыс запросов в секунду, ощущал неудовлетворенность.

По сути проблема заключалась в использовании в каждом запросе PHP-интерпретатора, что излишне загружало процессор. Нужно было каким-то образом избавиться от повторной генерации страниц. И как раз, на днях, на глаза стали попадаться статьи про кеширующий сервер Varnish. Решил его сегодня попробовать.

В Ubuntu устанавливается, как всегда, очень просто:

    # apt-get install varnish

Сразу после установки он запускается, но для его использования нужно еще верно указать порты frontend-серверу, что используются Varnish. Но перед этим немного изменим конфигурацию, для корректного использования WordPress. Изменяем файл <code>/etc/varnish/default.vcl</code>:

    backend default {
         .host = "127.0.0.1";
         .port = "8080";
     }

    # Unless this is the login or admin page, unset the cookie!
    sub vcl_recv {
    # admin users always miss the cache
      if( req.url ~ "^/wp-(login|admin)" || req.http.Cookie ~ "wordpress_logged_in_" ){
        return (pass);
      }
      # ignore any other cookies
      unset req.http.Cookie;
      return (lookup);
    }

<img class="aligncenter" src="https://static.juev.org/2010/09/varnishprojsoft1.jpg" alt="" width="240" height="140" />

И если первый блок остается почти без изменения, там изменяется только номер порта, по которому работает apache, обрабатывающий PHP-скрипты, то второй блок прописывается полностью. Он нужен для того, чтобы администратор мог работать с сайтом напрямую, минуя кэш. И для того, чтобы исключить все те cookies, что плодит WordPress. Без данного блока будет использоваться не кеш, а страницы каждый раз будут генерироваться по новой.

Теперь перезапускаем Varnish:

    # /etc/init.d/varnish restart

И изменяем конфигурацию виртуального сервера в nginx, у меня это файл <code>/etc/nginx/sites-available/juev.ru</code>, меняется только следующий раздел:

            location / {
                    proxy_set_header X-Real-IP  $remote_addr;
                    proxy_set_header Host $host;
                    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    #               proxy_pass http://127.0.0.1:8080; # Apache listening
                    proxy_pass http://127.0.0.1:6081; # Varnish listening
            }

То есть просто указали другой порт backend'а. Перезапускаем nginx и смотрим на работу сайта. Я протестировал работу сайта с помощью <em>ab</em>:

    # ab -n 5000 -c 100 http://www.juev.ru/index.php
     . . . 
    Concurrency Level:      100
    Time taken for tests:   0.952 seconds
    Complete requests:      5000
    Failed requests:        0
    Write errors:           0
    Non-2xx responses:      5000
    Total transferred:      1875000 bytes
    HTML transferred:       0 bytes
    Requests per second:    5253.66 [#/sec] (mean)
    Time per request:       19.034 [ms] (mean)
    Time per request:       0.190 [ms] (mean, across all concurrent requests)
    Transfer rate:          1923.95 [Kbytes/sec] received

    Connection Times (ms)
                  min  mean[+/-sd] median   max
    Connect:        0    2   2.5      1      11
    Processing:     2   17   5.8     17      46
    Waiting:        2   16   6.0     16      45
    Total:          2   19   5.7     18      46
     . . .

При этом, во время теста процессор практически не нагружался. Заметить работу теста было просто не возможно.

Разница между 20 запросами в секунду и 5253.66 довольно существенная. Я думаю, что использование Varnish в качестве дополнительной прослойки между Nginx и Apache вполне оправданно!

Итого Nginx занимается отдачей мультимедиа файлов и регулированием внешними соединениями, Apache занимается обработкой PHP-скриптов, а Varnish кеширует работу Apache. Система потихоньку усложняется, обрастает новыми элементами, но в то же время повышает свою эффективность и производительность. 

Я думаю, тут есть еще над чем поработать!
