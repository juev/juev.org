---
layout: post
title: Решение проблемы с дубликатами сайта
description: 
keywords: cloudfront, amazon, htaccess, seo
gplus: https://plus.google.com/116661482374124481456/posts/8BzrgTNqfd7
published: true
date: 2012-07-03 15:26
tags:
- amazon
- cloudfront
- tips
---

При использовании [CloudFront](/2012/07/02/cloudfront/ "Хостинг сайтов с помощью CloudFront") возникает проблема дублирования данных. Один и тот же сайт становится доступным по двум разным доменам.

С точки зрения поисковых систем это не очень хорошо. Для решения данной проблемы, в файл `.htaccess` необходимо добавить строки:

    <ifmodule mod_rewrite.c>
        RewriteEngine on
        RewriteCond %{HTTP_HOST} ^juevru-evsyukov\.rhcloud\.com$ [NC]
        RewriteCond %{HTTP_USER_AGENT} !Amazon\ CloudFront [NC]
        RewriteRule ^(.*)$ http://www.juev.ru/$1 [R=301,L]
    </ifmodule>

Где строки с RewriteCond задают определенные условия для выполнения действия, которое описано в строке с RewriteRule. В данном примере в качестве условий выбраны -- обращение по доменному имени `juevru-evsyukov.rhcloud.com`, на котором располагается оригинальный сайт и проверка, что зашедший пользователь не является ботом от амазона. А в качестве выполняемого действия задан переход на домен `www.juev.ru` с сохранением пути, по которому пользователь зашел на сайт.

Таким образом мы решили еще одну проблему!
