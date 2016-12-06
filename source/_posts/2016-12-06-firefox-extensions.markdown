---
layout: post
title: "Расширения Firefox 2016"
date: 2016-12-06 16:33
image:
tags:
  - mozilla
  - firefox
---

Несколько лет использовал в качестве своего основного браузера для дома Safari, а на работе использовал Google Chrome. С последним обновлением MacOS Safari стал слишком тормозным и неудобным, я и некоторое время и дома стал использовать Google Chrome.

Удобно, быстро, но с каждым днем параноя давала о себе знать все больше и больше. Дело в том, что хочешь ты того или нет, а Chrome о каждом твоем действии сообщает в Google, а так как браузер привязан к твоему профилю, то компания просто собирает о тебе информацию. И Google Analytics уже не нужно для этого использовать. В конце концов я снова вернулся к использованию Firefox. Поставил его и на работе и дома. Использую разные профили, но практически один и тот же набор расширений.

Первое время использовал только одно расширение: [NoScript](https://addons.mozilla.org/ru/firefox/addon/NoScript/ "NoScript"). Что могу сказать? Это самое лучшее расширение для обеспечения безопасности. Альтернатив для него не так много. Но с течением времени стал за собой замечать, что мне стало неудобно работать в интернете, постоянно включая скрипты для сайтов, что я просматриваю, или корректируя настройки расширения. И решил поискать что-то иное. Попроще.

На данный момент времени я сформировал следующий набор:

1. [HTTPS Everywhere](https://www.eff.org/https-everywhere "HTTPS Everywhere") для управления поведением браузера при использовании https-протокола.
1. [Self-Destructing Cookies](https://addons.mozilla.org/en-US/firefox/addon/self-destructing-cookies/?src=api "Self-Destructing Cookies") для управления Cookies-файлами
1. [uBlock Origin](https://github.com/gorhill/uBlock "uBlock Origin") для обеспечения безопасности и удаления рекламы с веб-страниц.

И если по первым двум особо рассказывать нечего, использую стандартные настройки. И только для ряда сайтов, где требуется авторизация, сохраняю Cookies. То для uBlock самостоятельно задаю настройки.

По сути, при использовании настроек по умолчанию, uBlock прекрасно работает. Но мне это не интересно и я использую настройки описанные в документации на странице [Blocking mode: hard mode](https://github.com/gorhill/uBlock/wiki/Blocking-mode:-hard-mode "Blocking mode: hard mode"). По умолчанию отключаются все сторонние скрипты, фреймы и ресурсы. И только для определенных ресурсов задаются определенные разрешающие правила. На текущий момент у меня сформировался следующий набор правил:

    no-cosmetic-filtering: * true
    * * 3p block
    * * 3p-frame block
    * * 3p-script block
    * ajax.googleapis.com * noop
    * akamaihd.net * noop
    * cloudfront.net * noop
    * facebook.com * block
    * facebook.net * block
    * fonts.googleapis.com * noop
    * googletagservices.com * block
    * googlevideo.com * noop
    * gravatar.com * noop
    * netdna-cdn.com * noop
    * netdna-ssl.com * noop
    * s3.amazonaws.com * noop
    * services.mozilla.com * noop
    * sstatic.net * noop
    * taboola.com * block
    * twitter.com * block
    * typekit.net * noop
    * vimeo.com * noop
    * youtube.com * noop
    * ytimg.com * noop
    amazon.com images-amazon.com * noop
    amazon.com ssl-images-amazon.com * noop
    amazonlightsail.com awsstatic.com * noop
    bookmate.com bmstatic.com * noop
    dropbox.com dropboxstatic.com * noop
    duckduckgo.com youtube-nocookie.com * noop
    duckduckgo.com ytimg.com * noop
    facebook.com facebook.com * noop
    facebook.com facebook.net * noop
    facebook.com fbcdn.net * noop
    feedbin.com instagram.com * noop
    feedbin.com twitter.com * noop
    feedbin.com typography.com * noop
    flickr.com s.yimg.com * noop
    garmin.com garmincdn.com * noop
    github.com githubapp.com * noop
    github.com githubusercontent.com * noop
    google.com googleusercontent.com * noop
    google.com gstatic.com * noop
    habrahabr.ru * 3p noop
    habrahabr.ru habracdn.net * noop
    habrahabr.ru habrastorage.org * noop
    lifehacker.com kinja-img.com * noop
    lifehacker.com kinja-static.com * noop
    mozilla.org mozilla.net * noop
    reddit.com redditmedia.com * noop
    reddit.com redditstatic.com * noop
    slideshare.net slidesharecdn.com * noop
    stackoverflow.com sstatic.net * noop
    ted.com tedcdn.com * noop
    twitter.com twimg.com * noop
    twitter.com twitter.com * noop
    vimeo.com vimeocdn.com * noop
    wikipedia.org wikimedia.org * noop
    wiktionary.org wikimedia.org * noop
    www.fastmail.com fastmailusercontent.com * noop
    www.wikia.com nocookie.net * noop
    www.youtube.com youtube-nocookie.com * noop

Само собой, что использовать весь набор правил совершенно не обязательно. Достаточно только задать первые несколько строк:

    no-cosmetic-filtering: * true
    * * 3p block
    * * 3p-frame block
    * * 3p-script block

И далее уже самостоятельно создавать отдельные правила для каждого отдельного сайта, используя всплывающее окно управления uBlock. Хотелось бы только акцентировать внимание на основных правилах, используемых для формирвания данного списка. Для управления доступом используются три типа действия:

1. allow -- разрешить доступ, при этом будут игнорироваться правила статической фильтрации
1. noop -- разрешить доступ, но при этом будут обрабатываться правила статической фильтрации, заданные на вкладке 3rd-party filters
1. block -- соответственно запретить доступ

Само правило формируется по принципу:

    source-hostname destination-hostname request-type action

То есть указывается, для какого ресурса данное правило применимо, что именно используется, тип запроса и затем указывается применимое действие.

Для одного и того же ресурса можно указывать несколько правил. К примеру, для того, чтобы запретить использование facebook скриптов на всех сайтах, но разрешить их использование на самом facebook можно воспользоваться следующими строками:

    * facebook.com * block
    * facebook.net * block
    facebook.com facebook.com * noop
    facebook.com facebook.net * noop
    facebook.com fbcdn.net * noop

Просто и эффективно.

При этом сам Firefox не стучит куда-либо без явного разрешения, всё находитья под полным контролем пользователя. На страницах не остается рекламы, и просматривать интернет становиться намного удобнее.
