---
layout: post
title: Использование Head.JS
keywords: headjs,head.js,webdesign,async,javascript,js
date: 2010-12-25 00:00
tags:
- javascript
- webdesign
---
После того, как подключился к <a href="http://pinboard.in/u:juev" rel="nofollow">pinboard.in</a>, на сервере нашел упоминание интересного проекта -- <a href="http://headjs.com/" rel="nofollow">Head JS</a>.

Проект ориентирован на упрощение, ускорение и модернизацию работы со скриптами и файлами стилей. Основная его идея заключается в параллельной загрузке используемых скриптов и файлов стилей. Позволяет так же определять используемый браузер, размер экрана и в зависимости от этой информации подгружать только необходимые файлы. Что делает возможным создавать стили под определенные устройства.

Проект существует не так давно и совсем недавно еще имел статус alpha. В связи с чем, найти хоть какую-нибудь информацию по его использованию, за исключением официальной документации не представляется возможным. Вчера вечером провел пару часов над внедрением данного проекта на страницы своего сайта. И теперь хочу поделиться своими находками и домыслами.

Единственно, я не использовал все возможности данного скрипта, и меня интересовала только возможность параллельной загрузки скриптов.

Для подключения, необходимо скачать со страницы <a href="http://headjs.com/#download" rel="nofollow">headjs.com/#download</a> файл <code>head.min.js</code> и разместить его на сервере. Затем в заголовке документа размещаем строку:

    <script src="/js/head.min.js"></script>

И теперь я просто покажу несколько примеров того, как модифицируются скрипты для использования их с Head JS.

<h3>Google Analitics</h3>
Исходный код скрипта:

    <script type="text/javascript">

      var _gaq = _gaq || [];
      _gaq.push(['_setAccount', 'UA-XXXXXXX-X']);
      _gaq.push(['_trackPageview']);

      (function() {
        var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
      })();

    </script>

Модифицированный:

    <script>
        head.js("http://www.google-analytics.com/ga.js", function() {
      var tracker = _gat._getTracker("UA-XXXXXXX-X");
      tracker._trackPageview();
        });
    </script>

<h3>Apture</h3>
Исходный код скрипта:

    <script id="aptureScript">
    (function (){var a=document.createElement("script");a.defer="true";a.src="http://www.apture.com/js/apture.js?siteToken=XXXXXXX";document.getElementsByTagName("head")[0].appendChild(a);})();
    </script>

Модифицированный:

    <script id="aptureScript">
    head.js("http://www.apture.com/js/apture.js?siteToken=XXXXXXX")
    </script>

И, естественно, оба скрипта можно объединить в одном блоке:

    <script>
        head.js("http://www.apture.com/js/apture.js?siteToken=XXXXXXX","http://www.google-analytics.com/ga.js", function() {
          var tracker = _gat._getTracker("UA-XXXXXXX-X");
          tracker._trackPageview();
        });
    </script>

Используемые мной скрипты небольшого размера, поэтому оценить прирост скорости загрузки довольно сложно. Однако на официально странице проводятся ссылки на тесты: <a href="http://headjs.com/test/script.html" rel="nofollow">headjs.com/test/script.html</a>, которые позволяют оценить разность в скорости загрузке одних и тех же скриптов, при размещении их в разделе Head, в конце документа, или при использовании Head.JS.

Судя по результатам, модуль Head JS позволяет скорость загрузку страницы более чем в два раза.
