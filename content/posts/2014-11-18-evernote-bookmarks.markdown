---
title: "Закладки в Evernote"
date: "2014-11-18T00:00:00+0400"
tags:
  - web
  - tips
  - evernote
  - ifttt
keywords: web, tips, evernote, ifttt
image: https://static.juev.org/2014/11/3d58aa2.jpg
---
С декабря 2010 года использую для хранения своих закладок в интернете сервис [Pinboard](https://pinboard.in). Сервис нравится и всем устраивает. Но буквально на днях сервер из-за проблем с базой данных был недоступен в течение нескольких часов. И как раз в этот момент мне понадобилась одна их сохраненных ранее ссылок.

Именно в тот момент осознал, что помимо прямого использования сервиса нужно иметь запасной вариант. Долго думал, и понял, что ничего лучше Evernote для этого нет. Провел экспорт закладок в HTML-документ. Вставил текстом в отдельную заметку и таким образом получил полную копию своих ссылок. А чуть позже провел сортировку по отдельным заметкам, где каждая заметка была посвящена определенной теме.

Осталась только одна проблема: каким образом проводить обновление закладок в Evernote?? Даже обычное добавление закладки уже представляет собой проблему, так как по умолчанию веб-клипер создает отдельную заметку для каждой закладки.

Вспомнил про [IFTTT](https://ifttt.com), сервис, позволяющий связывать между собой различные интернет-сервисы. И создал правило, по которому при добавлении закладки в Pinboard, отмеченной как "почитать потом", производиться добавление ссылки с заголовком в определенную запись.

В итоге получается следующее:

![](https://static.juev.org/2014/11/Evernote-Bookmarks.png)

Если обратите внимание, первые две ссылки пришли сокращенными. Что затрудняет работу с ними. Оказалось, что нужно выключить сокращения ссылок в настройках профиля IFTTT (данная опция включена по умолчанию).

Так же для информации, кто захочет создать подобное же правило, канал Pinboard в сервисе IFTTT может предоставлять только ссылки доступные всем окружающим и не может экспортировать ссылки для отложенного чтения. Данная проблема решается использованием RSS-канала, который существует для каждой категории ссылок в сервисе.

![](https://static.juev.org/2014/11/ifttt-1.jpg)

И, разумеется, для быстрого добавления ссылок в Evernote можно использовать и другие сервисы, к примеру, тот же Instapaper, Pocket…
