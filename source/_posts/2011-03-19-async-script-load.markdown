---
layout: post
title: Асинхронная загрузка скриптов
keywords: async,css,javascript,webdesign
description: Ускоряем сайт за счет асинхронной загрузки скриптов
date: 2011-03-19 00:00
tags:
- javascript
- css
---

Размер используемых на сайте скриптов достиг уже 150 килобайт. В момент загрузки страницы загрузка файлов останавливатеся до тех
пор, пока не будет загружен файл скрипта.

И при этом не имеет ровно никакого значения, идет загрузка с одного хоста или же с CDN. В связи с этим загрузка страниц моего
сайта стала занимать порядка 2.6 секунд. За счет использования gzip-сжатия удалось довести загрузку примерно до 2 секунд.

<a href="https://static.juev.org/2011/03/webpagetest_nsync.png"><img
src="https://static.juev.org/2011/03/webpagetest_nsync.th.png" class="aligncenter"></a>

Решением проблемы оказалось использование **метода асинхронной загрузки скриптов**.

Для этого достаточно вместо стандартного включения скрипта в разделе `head` файла

	<script type="text/javascript" src="http://url_to_file.js"></script>

прописать перед закрывающим тегом `</body>` следующий блок:

	<script type="text/javascript">
		var script = document.createElement("script")
		script.type = "text/javascript";
		script.src = 'http://url_to_file.js';
		document.getElementsByTagName("head")[0].appendChild(script);
	</script>

После чего загрузка файлов уже не блокируется и загрузка страницы стала проходить гораздо быстрее.

<a href="https://static.juev.org/2011/03/webpagetest_sync.png"><img
src="https://static.juev.org/2011/03/webpagetest_sync.th.png" class="aligncenter"></a>

В будущем, при использовании `html5` использовать `async` загрузку будет еще проще. Достаточно будет в разделе `head` прописать
включение скриптов в виде:

	<script async src="someAsyncScript.js" onload="someInit()"></script> 
	<script defer src="someDeferScript.js" onload="someInit()"></script> 

*Аргумент `onload` не обязательный.*

В обоих случаях мы получаем асинхронную загрузку скриптов. Разница заключается только в моменте, когда скрипт начинает
выполняться. Скрипт с атрибутом `async` выполнится при первой же возможности после его полной загрузки, но до загрузки объекта
**window**. В случае использования атрибута `defer` – скрипт не нарушит порядок своего выполнения по отношению к остальным скриптам и
его выполнение произойдет после полной загрузки и парсинга страницы, но до события **DOMContentLoaded** объекта document.

Единственно что останавливает, на данный момент этот механизм реализован в Firefox, начиная с версии 3.6, частично в IE9, и в браузерах,
основанных на движке WebKit (Safari, Google Chrome).
