---
layout: post
title: Amazon S3 and Cache Control
description: 
keywords: amazon, s3, cache, control, s3cmd
gplus: https://plus.google.com/116661482374124481456/posts/JnJtN9RLjjH
published: true
date: 2013-03-08 19:58
tags:
- amazon
- soft
---

Перенес свои сайты на Amazon S3 и озадачился проблемой управления кешированием страниц. На обычном сервере все просто, достаточно прописать необходимые директивы в файл `.htaccess` или задать требуемые настройки в конфигурацию nginx.

С S3 bucket несколько сложнее, загрузить объекты на сервер просто, но как управлять их доступом/заголовками? Вот тут на помощь и приходит консольная утилита `s3cmd`.

Раньше для загрузки сайта на сервер S3 я использовал следующую команду:

    $ s3cmd sync -P --delete-removed --no-preserve public/ s3://www.juev.ru/

Теперь же у меня используется несколько команд, которые загружают определенные объекты и присваивают им нужные заголовки:

    $ s3cmd sync --acl-public --exclude "*.*" --include "*.png" --include "*.jpg" --include "*.ico" --add-header="Expires: Sat, 20 Nov 2020 18:46:39 GMT" --add-header="Cache-Control: max-age=6048000" --no-preserve public/ s3://www.juev.ru/
    $ s3cmd sync --acl-public --exclude "*.*" --include  "*.css" --include "*.js" --add-header="Cache-Control: max-age=604800"  --no-preserve public/ s3://www.juev.ru    
    $ s3cmd sync --acl-public --exclude "*.*" --include "*.html" --add-header="Cache-Control: max-age=0, private, must-revalidate" --no-preserve public/ s3://www.juev.ru    
    $ s3cmd sync --acl-public --exclude ".DS_Store" --exclude "assets/" --exclude "js/" --no-preserve public/ s3://www.juev.ru/    
    $ s3cmd sync --acl-public --delete-removed --no-preserve public/ s3://www.juev.ru/
  
Используемые ключи:

* `--acl-public`, как и `-P` -- делают файлы видимыми для всех, 
* `--delete-removed` -- позволяет на сервере удалить те файлы, что были удалены на компьютере,
* `--no-preserve` -- удаляют заголовки доступа файла в локальной системе,
* `--exclude` -- исключение из передачи файлов определенного типа,
* `--include` -- включение в передачу файлов определенного типа,
* `--add-header` -- ключ, позволяющий задать заголовки управляющие кешированием и другими директивами.

Таким образом, если раньше передача шла в один поток, то теперь она разбивается на несколько этапов, в каждый из которых передаются только файлы определенного типа и каждому этапу соответствует свой определенный тип кеширования.

Довольно простой прием, который позволил мне задать для страниц сайта тот уровень кеширования, что мне нужен.
