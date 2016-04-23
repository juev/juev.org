---
layout: post
title: Использование вебшрифтов с серверов Амазона
date: 2015-06-07 21:26
image: https://static.juev.org/2015/06/amazon-web-services.png
tags:
  - amazon
  - web
  - design
---

Когда писал статью [Amazon S3: кеширование страниц веб-сайта](http://www.juev.org/2015/06/01/amazon-cache/) затронул вопрос Cross-Origin Resource Sharing, ошибочно приняв его за решение проблемы с кешированием. И вот сегодня мне пришлось чуть более подробно разобраться с CORS.

Дело в том, что я решил перенести все свои ресурсы сайта (стили, скрипты, изображения, в том числе и шрифты) на сервера Amazon Cloudfront. И дело в том, что после переноса, браузеры стали мне показывать ошибку загрузки файлов шрифта из-за неутановленного заголовка запроса.

Оказалось, что дело именно в разрешениях, что задаются с помощью CORS. Решение нашлось довольно быстро: заходим через веб-интерфейс в консоль управления, выбираем нашу корзину, в которой хранятся все данные для Cloudfront и как описывал в выше упоминавшейся статье, вносим изменения в CORS-конфигурацию:

	<CORSConfiguration>
	  <CORSRule>
		<AllowedOrigin>http://mydomain.com</AllowedOrigin>
		<AllowedMethod>GET</AllowedMethod>
		<MaxAgeSeconds>3000</MaxAgeSeconds>
		<AllowedHeader>Content-*</AllowedHeader>
		<AllowedHeader>Host</AllowedHeader>
	  </CORSRule>
	  <CORSRule>
		<AllowedOrigin>http://*.mydomain.com</AllowedOrigin>
		<AllowedMethod>GET</AllowedMethod>
		<MaxAgeSeconds>3000</MaxAgeSeconds>
		<AllowedHeader>Content-*</AllowedHeader>
		<AllowedHeader>Host</AllowedHeader>
	  </CORSRule>
	</CORSConfiguration>

После чего в той же консоли нужно перейти в управление Cloudfront. Там выбрать "Distribution Settings" и вкладку "Behaviors". Минимум одна группа поведения там уже должна присутствовать, поэтому выбираем ее и переходим к ее изменению, нажав кнопку Edit. Для параметра "Forward Headers" меняем значение с "None (Improves Caching)" на "Whitelist" и затем в секции "Whitelist Headers" выбираем Origin:

[![Behavior](https://static.juev.org/2015/06/behavior-th.png)](https://static.juev.org/2015/06/behavior.png "Behavior")

Теперь только остается провести инвалидацию для загружанных ранее файлов шрифтов. Сделать это можно так же через веб-интерфейс, в разделе Cloudfront, вкладка Invalidations. Через 10-15 минут шрифты будут доступны для загрузки и не будут блокироваться политикой браузеров.
