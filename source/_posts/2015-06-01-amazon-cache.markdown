---
layout: post
title: "Amazon S3: кеширование страниц веб-сайта"
date: 2015-06-01 12:17
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

![CORS](http://static.juev.org/2015/06/CORS.png "CORS Configuration")

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

