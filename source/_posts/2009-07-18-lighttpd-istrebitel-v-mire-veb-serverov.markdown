---
layout: post
title: lighttpd - истребитель в мире веб-серверов
keywords: apache,lighttpd,config
date: 2009-07-18 00:00
tags:
- lighttpd
- apache
- vps
---
При использовании VPS-сервера с мощным ограничением памяти у меня встал вопрос -- какой веб-сервер использовать? Apache отпал сразу, так как потребляет очень много памяти даже на один ресурс. Попробовал отечественную разработку nginx, намного лучше, но настройка оказалась не тривиальной, приходилось копаться в интернете, чтобы решить довольно простые задачи. И по памяти, хотя и много меньше nginx потреблял чем apache, но как оказалось, есть гораздо лучшее решение.

Если честно, я немного лукавлю, когда говорю, что начинал свои тесты с apache и затем переходил на nginx. Конечно же, это было не так. Еще до заказа VPS-сервера я знал, что буду использовать lighttpd, но нужно было протестировать и остальные сервисы. Что я собственно и сделал. Но уже после того, как досконально обкатал lighttpd...

При использовании в условиях жесткого ограничения памяти lighttpd показал себя только с наилучшей стороны. Он потреблял порядка 5-8 мегабайт памяти на все домены, которые были на него настроены. В отличие от nginx, процесс которого в памяти занимал более 30 мегабайт. Апач при тех же условиях сжирал всю доступную память. И в тоже время настройка lighttpd столь тривиальна, что на ней можно было бы и не останавливаться. Но хочу показать, насколько это просто.

Основная часть VPS-серверов использует Debian, поэтому я буду рассматривать именно эту операционную систему. Настройка в других операционных системах несколько отличается от представленной.

Если VPS-сервер был заказан с установленным апачем, его необходимо отключить и убрать из автозагрузки:

{% highlight shell %}
~# /etc/init.d/apache2 stop
~# update-rc.d -f apache2 remove
{% endhighlight %}

Теперь можно приступать к установке легкого веб-сервера:

{% highlight shell %}
~# apt-get install lighttpd
{% endhighlight %}

Начиная с этого момента на сервере уже будет работать lighttpd, осталось его настроить. Разберем возможность использования PHP и MySQL на веб-сервере. Для этого, если это не было сделано заранее, установим необходимые пакеты:

{% highlight shell %}
~# apt-get install php5-cgi mysql-server mysql-client
{% endhighlight %}

При установке mysql-сервера будет запрошен пароль на доступ к серверу. Не забудьте его задать, иначе сервер баз данных будет открыт для доступа из интернета. Теперь нужно только включить модуль fastcgi в lighttpd:

{% highlight shell %}
~# lighttpd-enable-mod
    Available modules: auth cgi fastcgi proxy rrdtool simple-vhost ssi ssl status userdir phpmyadmin
    Already enabled modules: auth fastcgi simple-vhost phpmyadmin
    Enable module:
{% endhighlight %}

Используется команда <em>lighttpd-enable-mod</em>, если запустить ее без параметров, как показано в примере, будут выведены имена всех доступных модулей и предложено включить нужные. Можно сократить немного времени, если сразу задавать команду с параметром в виде имени того модуля, что нужно активировать:

{% highlight shell %}
~# lighttpd-enable-mod fastcgi
{% endhighlight %}

После выполнения этой команды нужно будет перезагрузить веб-сервер:

{% highlight shell %}
~# /etc/init.d/lighttpd force-reload
{% endhighlight %}

Теперь наш веб-сервер может работать с PHP-скриптами. Проверим. Для этого в корне нашего сайта (по умолчанию все сайты располагаются в <em>/var/www/</em>) создаем файл <em>info.php</em> со следующим содержимым:

{% highlight php %}
<?php
    phpinfo();
?>
{% endhighlight %}

И обращаемся к нашему веб-серверу с помощью браузера по адресу `www.examples.ru/info.php`, в данном случае подразумевается, что www.examples.ru имя сайта, если доменное имя еще не зарегистрировано, можно вместо него обращаться по ip-адресу. В ответ должны получить полную информацию о используемом PHP.

Для отключения модуля используется команда <em>lighttpd-disable-mod</em>.

После перезапуска веб-сервера в памяти будут висеть несколько процессов <em>php-cgi</em>, каждый из которых занимает порядка 30 мегабайт (после оптимизации использования стека оперативной памяти). Количество процессов напрямую зависит от значения переменной <em>max-procs</em>, заданной в файле <em>/etc/lighttpd/conf-available/10-fastcgi.conf</em>, минимальное значение равно единице (1), при этом будет использоваться 2 процесса <em>php-cgi</em>.

По умолчанию fastcgi настроено на обработку файлов <em>.php</em>. Если необходимо использовать perl, python или ruby, необходимо изменять файл <em>/etc/lighttpd/conf-available/10-fastcgi.conf.</em> Например, если необходимо отключить обработку php-файлов и включить python для использования django, приводим его к такому виду:

{% highlight conf %}
## FastCGI programs have the same functionality as CGI programs,
## but are considerably faster through lower interpreter startup
## time and socketed communication
##
## Documentation: /usr/share/doc/lighttpd-doc/fastcgi.txt.gz
##                http://www.lighttpd.net/documentation/fastcgi.html

server.modules   += ( "mod_fastcgi" )

fastcgi.server    = (
    "/" => (
        "main" => (
            # Use host / port instead of socket for TCP fastcgi
            "host" => "127.0.0.1",
            "port" => 3033,
            #"socket" => "/tmp/django.socket",
            "check-local" => "disable",
        ))
)

alias.url = (
    "/media" => "/var/www/django/django/contrib/admin/media/",
)

url.rewrite-once = (
    "^(/media.*)$" => "$1",
    "^/favicon\.ico$" => "/media/favicon.ico",
    "^(/.*)$" => "/example$1",
)
{% endhighlight %}

Останавливаться на подробностях настройки различных движков я не буду. А перейду сразу к простому использованию виртуальных хостов. В том же apache для использования виртуальных хостов необходимо каждый раз менять конфигурацию сервера и перезапускать его. В lighttpd есть отдельный модуль, который необходимо активировать, настроить, после чего виртуальные хосты можно будет организовывать путем простого создания каталогов. Начинаем:

{% highlight shell %}
~# vim /etc/lighttpd/conf-available/10-simple-vhost.conf
{% endhighlight %}

И проверяем значения переменных <em>simple-vhost.server-root</em> и <em>simple-vhost.document-root</em>:

{% highlight conf %}
## Simple name-based virtual hosting
##
## Documentation: /usr/share/doc/lighttpd-doc/simple-vhost.txt
##                http://www.lighttpd.net/documentation/simple-vhost.html

server.modules += ( "mod_simple_vhost" )

## The document root of a virtual host isdocument-root =
##   simple-vhost.server-root + $HTTP["host"] + simple-vhost.document-root
simple-vhost.server-root         = "/var/www"
simple-vhost.document-root       = "/html/"

## the default host if no host is sent
simple-vhost.default-host        = "example.ru"
{% endhighlight %}

В данном случае все виртуальные хосты будут располагаться в каталоге /var/www и каждый виртуальный хост содержит в себе папку html, в которой располагаются сами файлы. Теперь активируем модуль виртуальных хостов:

{% highlight shell %}
~# lighttpd-enable-mod simple-vhost
{% endhighlight %}

И после перезапуска веб-сервера, начинаем создавать виртуальные хосты:

{% highlight shell %}
~# /etc/init.d/lighttpd restart
~# mkdir /var/www/test1.ru
~# mkdir /var/www/test1.ru/html
~# mkdir /var/www/test2.ru
~# mkdir /var/www/test2.ru/html
{% endhighlight %}

И начинаем заполнять содержимое наших двух, только что организованных сайтов <em>test1</em> и <em>test2</em>. Естественно, чтобы все работало, данные доменные имена должны быть зарегистрированы. Сразу после создания данных каталогов и создания нужных файлов в каталогах html сайты будут работать. Теперь не нужно для организации нового сайта перезагружать веб-сервер.

Как видите, веб-сервер является самым легким из всех существующих решений, которые есть на сегодняшний день. И в то же время его очень просто настраивать. Все тривиально и очень просто!
