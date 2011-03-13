--- 
layout: post
title: !binary |
  0K3RhNGE0LXQutGC0LjQstC90L7RgdGC0Ywg0LjRgdC/0L7Qu9GM0LfQvtCy
  0LDQvdC40Y8gSGVhZC5KUw==

---
Недавно познакомился со скриптом <a href="http://headjs.com/">Head.JS</a>, и в последнее время стараюсь использовать его во всех своих проектах. О том, как работать с данным скриптом я описывал в статье <a href="http://www.juev.ru/2010/12/25/use-head-js/">Использование Head.JS</a>. Но тогда не смог провести тестов результативности использования данного скрипта. 

Теперь же, я провел исследование и спешу поделиться результатами.

Все эксперименты проводились на одном и том же сайте <a href="http://juev.info">juev.info</a>. Измерение скорости загрузки проводилось с помощью интернет-сервиса <a href="http://www.webpagetest.org/">www.webpagetest.org</a>.

Результаты работы представлены на страницах:
<ol>	<li><a href="http://www.webpagetest.org/result/110103_VR_91d517fd449abfc43ca25ef5a04bc7c7/">стандартное подключение скриптов</a></li>
	<li><a href="http://www.webpagetest.org/result/110103_VG_1965c3562a67e54876269f264e5424ed/">с использованием Head.JS</a></li></ol>

На странице представлены следующие скрипты:
<ol>	<li>google analytics</li>
        <li>apture</li>
        <li>evernote</li></ol>

Скрипты небольшие, но из-за того, что они загружались последовательно, скорость загрузки очень сильно падала. Порядок загрузки файлов без использования <code>Head.JS</code> и использования подключения комментариев facebook с помощью обычного скрипта:

<a href="http://static.juev.ru/2011/01/1_waterfall.png" id="lightbox"><img src="http://static.juev.ru/2011/01/1_waterfall-298x300.png" alt="" title="1_waterfall" width="298" height="300" class="aligncenter size-medium wp-image-1309" /></a>

Порядок загрузки файлов с использованием <code>Head.JS</code> и использования подключения комментариев facebook с помощью асинхронного скрипта:

<a href="http://static.juev.ru/2011/01/1_waterfall_head.png" id="lightbox"><img src="http://static.juev.ru/2011/01/1_waterfall_head-300x170.png" alt="" title="1_waterfall_head" width="300" height="170" class="aligncenter size-medium wp-image-1310" /></a>

Бросается в глаза, что все скрипты теперь грузятся одновременно и при этом на их загрузку тратиться гораздо меньше времени. А использование асинхронного скрипта facebook позволяет существенно уменьшить количество обращений к серверу и выполнять его обработку во время загрузки других файлов. 

В итоге время полной загрузки страницы уменьшилось с 8 до 2.8 секунды! На мой взгляд, хороший показатель эффективности работы. 
