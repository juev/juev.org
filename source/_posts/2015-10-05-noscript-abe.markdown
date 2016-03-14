---
layout: post
title: "NoScript ABE"
date: 2015-10-05 09:05
image: https://static.juev.org/2015/10/ABE.png
tags:
  - firefox
  - web
  - privacy
---

Как описывал в [прошлой статье](http://www.juev.org/2015/09/27/firefox-privacy/ "Безопасность в сети Интернет"), работать в интернете лучше всего с отключеным JavaScript, разрешая с помощью расширения Noscript выполнение только доверенных скриптов.

Помимо этого, одной из функций данного расширения является [Application Boundaries Enforcer](https://noscript.net/abe/ "ABE - Application Boundaries Enforcer"), которое позволяет более гибко управлять разрешениями для скриптов.

Для изменения параметров ABE необходимо перейти в настройки расширения Noscript, открыть вкладку "Дополнительно" и на данной вкладке перейти к пункту ABE.

![ABE](https://static.juev.org/2015/10/ABE.png "ABE")

По умолчанию правила включены и прописано только одно системное:

    # Prevent Internet sites from requesting LAN resources.
    Site LOCAL
    Accept from LOCAL
    Deny

Здесь же можно разрешить сайтам устанавливать свои правила (на данный момент времени таких сайтов по пальцам пересчитать можно).

Общие правила прописываются разделе System, все остальные в разделе User. К примеру, для того, чтобы разрешить выполнение скриптов Facebook только на сайте Facebook и запретить внедрять их на остальных сайтах, можно использовать следующее правило:

    Site .facebook.com .fbcdn.net
    Accept from .facebook.com .fbcdn.net
    Deny INCLUSION(SCRIPT, OBJ, SUBDOC)

Аналогичное правило для twitter:

    Site platform.twitter.com
    Accept from twitter.com
    Deny INCLUSION(SCRIPT, OBJ, SUBDOC)

Для того, чтобы разрешить RECAPTCHA на сайтах, замкнуть Google на самого себя, а Youtube использовать анонимно, можно использовать следующие правила:

    Site ^https?://www\.google\.com/recaptcha/*
    Accept
    Site ^https?://www\.google\.com/*
    Sandbox
    Site .youtube.com .ytimg.com .googlevideo.com
    Anonymize

Больше примеров и пояснений по правилам можно найти на [официальной странице](https://noscript.net/abe/ "ABE - Application Boundaries Enforcer") и на [форуме](https://forums.informaction.com/viewforum.php?f=3 "InformAction Forums").

Обращаю так же внимание на тот момент, что для того, чтобы скрипты Facebook выполнялись только на Facebook и нигде больше, помимо добавления правила в ABE, в настройках NoScript потребуется разрешить их выполнение, то есть добавить их в доверенные. После чего именно ABE будет управлять их запуском.
