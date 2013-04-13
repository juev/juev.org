---
layout: post
title: Varnish for Wordpress
keywords: wordpress,varnish,speed
date: 2010-09-22 00:00
tags:
- wordpress
- varnish
---
Я уже описывал в статье <a href="/2010/09/10/wordpress-varnish/">WordPress Speed Up</a>, что использование кеширующего веб-сервера Varnish позволяет существенно увеличить количество обрабатываемых запросов в секунду. Что позволяет справляться с наплывом посетителей даже слабому серверу.

Однако приходилось использовать конфиг, который был пригоден только для wordpress. И использовать Varnish для другого движка уже не представлялось возможным. При этом использование страниц из кеша составляло примерно 70% от общего числа всех запросов. Что в целом не плохо, но создавалось впечатление, что могло быть и лучше.

Сегодня разговаривал с <a href="http://snupt.com/" rel="nofollow">Дмитрием aka Snupt</a>, он перешел на использование конфигурации Varnish, при которой производится кеширование только статичных файлов (различные медиа файлы, файлы стилей и т.п.), а вся динамика передавалась непосредственно apache для обработки. Я решил попробовать данный вариант.

Файл <code>/etc/varnish/default.vcl</code> изменил на следующий:

     backend default &#123;
         .host = "127.0.0.1";
         .port = "8080";
     }

    sub vcl_recv &#123;
    # Normalize Content-Encoding
        if (req.http.Accept-Encoding) &#123;
            if (req.url ~ "\.(jpg|png|gif|gz|tgz|bz2|lzma|tbz)(\?.*|)$") &#123;
                remove req.http.Accept-Encoding;
            } elsif (req.http.Accept-Encoding ~ "gzip") &#123;
                set req.http.Accept-Encoding = "gzip";
            } elsif (req.http.Accept-Encoding ~ "deflate") &#123;
                set req.http.Accept-Encoding = "deflate";
            } else &#123;
                remove req.http.Accept-Encoding;
            }
        }
    # Remove cookies and query string for real static files
        if (req.url ~ "^/[^?]+\.(jpeg|jpg|png|gif|ico|js|css|txt|gz|zip|lzma|bz2|tgz|tbz|html|htm)(\?.*|)$") &#123;
           unset req.http.cookie;
           set req.url = regsub(req.url, "\?.*$", "");
        }
    }

Перезапустил Varnish и провел повторный тест с помощью 

    ab -n 10000 -c 500 http://www.juev.ru/index.php

Число обрабатываемых запросов выросло, незначительно, но все же. При этом нагрузка на процессор почти не ощущается.

    Server Software:        nginx/0.7.65
    Server Hostname:        www.juev.ru
    Server Port:            80

    Document Path:          /index.php
    Document Length:        0 bytes

    Concurrency Level:      500
    Time taken for tests:   3.341 seconds
    Complete requests:      10000
    Failed requests:        0
    Write errors:           0
    Non-2xx responses:      10001
    Total transferred:      3850374 bytes
    HTML transferred:       0 bytes
    Requests per second:    2993.06 [#/sec] (mean)
    Time per request:       167.053 [ms] (mean)
    Time per request:       0.334 [ms] (mean, across all concurrent requests)
    Transfer rate:          1125.43 [Kbytes/sec] received

    Connection Times (ms)
                  min  mean[+/-sd] median   max
    Connect:        0    2  30.7      0    3000
    Processing:     1   50  59.8     34     650
    Waiting:        1   50  59.7     34     650
    Total:         28   52  72.3     34    3001

Увеличил число работающих процессов nginx до 4 и получил результат еще лучше:

    Server Software:        nginx/0.7.65
    Server Hostname:        www.juev.ru
    Server Port:            80

    Document Path:          /index.php
    Document Length:        0 bytes

    Concurrency Level:      500
    Time taken for tests:   2.226 seconds
    Complete requests:      10000
    Failed requests:        0
    Write errors:           0
    Non-2xx responses:      10000
    Total transferred:      3829990 bytes
    HTML transferred:       0 bytes
    Requests per second:    4492.28 [#/sec] (mean)
    Time per request:       111.302 [ms] (mean)
    Time per request:       0.223 [ms] (mean, across all concurrent requests)
    Transfer rate:          1680.22 [Kbytes/sec] received

    Connection Times (ms)
                  min  mean[+/-sd] median   max
    Connect:        0    7   7.1      6      45
    Processing:     2   38  67.6     22     381
    Waiting:        2   36  67.3     20     375
    Total:          7   46  72.5     28     412

И самое главное! Изменился процент использования кеша:

         10029         0.00        97.37 Client connections accepted
         10029         0.00        97.37 Client requests received
         10005         0.00        97.14 Cache hits
             6         0.00         0.06 Cache misses

О такой эффективности можно было только мечтать. Только 6 запросов было направлено к apache, все остальное бралось из кеша.

Спасибо <a href="http://snupt.com/" rel="nofollow">Дмитрию aka Snupt</a> за столь бесценный опыт!
