---
layout: post
title: "Amazon S3: кеширование страниц веб-сайта"
date: 2015-06-01 12:17
image: https://static.juev.org/2015/06/amazon-s3.png
tags:
  - amazon
  - tips
---

Во время публикации сайта с использованием [s3_website](https://github.com/laurilehmijoki/s3_website "laurilehmijoki/s3_website") есть возможность управлять кешированием для файлов определенных типов. Для этого в конфигурации есть отдельный раздел:

    max_age:
      "assets/*": 6000
      "*": 300

В приведенном примере для файлов из директории assets задается время жизни в 6000 секунд, а для всех остальных  300 секунд. Вроде все просто и замечательно. Но, как оказалось, амазон использует свои собственные параметры, задаваемые при создании нового bucket для веб-сайта. И эти настройки являются более приоритетными, чем те, что задаются отдельно для каждого файла.

Для того, чтобы поправить эти настройки достаточно зайти на веб-страницу со списком всех bucket и в разделе Permissions выбрать кнопку "Edit CORS Configuration":

[![Settings](https://static.juev.org/2015/06/bucket.png "Bucket Setting")](https://static.juev.org/2015/06/bucket.png "Bucket Settings")


[![CORS](https://static.juev.org/2015/06/CORS.png "CORS Configuration")](https://static.juev.org/2015/06/CORS.png "CORS Configuration")

По умолчанию будет примерно следующая конфигурация:

    <?xml version="1.0" encoding="UTF-8"?>
    <CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
      <CORSRule>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedMethod>GET</AllowedMethod>
        <MaxAgeSeconds>3000</MaxAgeSeconds>
        <AllowedHeader>Authorization</AllowedHeader>
      </CORSRule>
    </CORSConfiguration>

Для того, чтобы параметры кеширования брались только из параметров файлов, достаточно изменить параметр MaxAgeSeconds в 0:

    <?xml version="1.0" encoding="UTF-8"?>
    <CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
      <CORSRule>
        <AllowedOrigin>*</AllowedOrigin>
        <AllowedMethod>GET</AllowedMethod>
        <MaxAgeSeconds>0</MaxAgeSeconds>
        <AllowedHeader>Authorization</AllowedHeader>
      </CORSRule>
    </CORSConfiguration>

И теперь можно для html-файлов задавать время жизни в 0 секунд. Что позволит показывать пользователям всегда актуальную версию страницы. И при этом иметь возможность сохранять стили и скрипты на продолжительное время.

### Update (Jun 07 2015)

CORS расшифровывается как Cross-Origin Resource Sharing, и данная технология используется для шаринга ресурсов приложения между различными доменами. Эксперимент с использованием CORS проведен некорректно.

Как выяснилось позже, моя ошибка заключалась в том, что я задавал параметры кеширования через max_age и в итоге получал следующий ответ от сервера:

    Cache-Control: no-cache; max-age=0

В то время как требовалось получать ответ:

    Cache-Control: no-cache, no-store

Более подробный ответ на вопрос почему, можно найти на странице [developers.google.com](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching?hl=ru). Как оказалось, самый важный здесь именно параметр no-store.

Для этого в s3_website используется параметр `cache_control`:

    cache_control: public, no-transform, max-age=1200, s-maxage=1200

или различные правила, для различных ресурсов:

    cache_control:
      "assets/*": public, max-age=3600
      "*": no-cache, no-store

Только после внесения изменения в конфигурацию s3_website и повторной публикаций с принудительным обновлением ресурсов, получил требуемый результат: веб-страницы загружаются заново при каждом запросе, а все ресурсы из директории assets хранятся в кеше месяц.

Результаты: [прежняя конфигурация](http://www.webpagetest.org/result/150607_Q2_9FG/) и [новая конфигурация](http://www.webpagetest.org/result/150607_YT_DWF/). Обратите особое внимание на количество запросов при повторном обращении к серверу.
