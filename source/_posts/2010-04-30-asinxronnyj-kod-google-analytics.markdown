---
layout: post
title: Асинхронный код Google Analytics
keywords: google,analitics,internet,counter,async
date: 2010-04-30 00:00
tags:
- google
- internet
---
Google помимо предоставления своих сервисов, типа почты, rss-ридера, google docs и других, предоставляет возможность отслеживать статистику посещений своего сайта. Данный сервис называется Google Analitics.

В отличие от обычного счетчика, GA предоставляет возможность анализировать посещения, т.е. фиксируется время посещения, его продолжительность, страну посетителя, показывает поисковые запросы, по которым пришел посетитель и т.д.

Так же есть возможность устанавливать определенные цели и отслеживать эффективность тех или иных технологий, служащих повышению трафика. Не использовать GA -- на мой взгляд большая ошибка любого веб-мастера.

И вот, не так давно, Google представила общественности новый код GA, который позволяет работать асинхронно. Рассмотрим, в чем его преимущество?

Сама по себе установка кода GA довольно проста. Необходимо пройти регистрацию в системе <a
href="http://www.google.com/analytics/" rel="nofollow">www.google.com/analytics</a> и добавить свой ресурс в систему. После чего взять сгенерированный код скрипта и разместить его на страницах своего сайта. Сделать это намного проще, если используется какой-либо блого-движок.

Для wordpress можно установить отдельный плагин (рекомендовать конкретный не буду, так как их довольно много). Или же просто изменить файлы шаблона, добавив код в заголовок генерируемого html-документа или же в конец файла.

До момента выпуска асинхронного кода, скрипт выполнялся последовательно вслед за другими скриптами на странице (после загрузки соответствующих элементов). Что, естественно, сказывалось на времени загрузки страниц.

Обычный код скрипта, который до сих пор предлагают для установки на сайте GA, выглядит вот так:

    <script type="text/javascript">
    var gaJsHost = (("https:" == document.location.protocol) ? "https://ssl." : "http://www.");
    document.write(unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E"));
    </script>

    <script type="text/javascript">
    try {
    var pageTracker = _gat._getTracker("UA-XXXXX-X");
    pageTracker._trackPageview();
    } catch(err) {}</script>
    <script type="text/javascript">var gaJsHost = (("https:" == document.location.protocol) ? "https://ssl." : "http://www.");document.write(unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E"));</script><script type="text/javascript">try {var pageTracker = _gat._getTracker("UA-7957198-2");pageTracker._trackPageview();} catch(err) {}</script>

На странице кода отслеживания появилась еще ссылка для выбора асинхронного кода:

    <script type="text/javascript">

      var _gaq = _gaq || [];
      _gaq.push(['_setAccount', 'UA-XXXXX-X']);
      _gaq.push(['_trackPageview']);

      (function() {
        var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
      })();

    </script>

Как видно, код представляет собой только один скрипт, а не как раньше два. И сам код значительно сократился.

Весь функционал остался на прежнем уровне. Но вот только не ясно, стала ли страница загружаться быстрее? Проводил тесты, изменения минимальные (стало быстрее на 100 ms).

Решил пока оставить новый код. Возможно упускаю из вида что-то другое.
