---
layout: post
title: 'awesome: рабочее окружение'
excerpt: !binary |-
  0J/QviDRgdCy0L7QtdC5INGB0YPRgtC4INCyINC30LDQtNCw0YfRgyDQvtC6
  0L7QvdC90L7Qs9C+INC80LXQvdC10LTQttC10YDQsCDQstGF0L7QtNC40YIg
  0YLQvtC70YzQutC+INGD0L/RgNCw0LLQu9C10L3QuNC1INC+0LrQvdCw0LzQ
  uCDQvdCwINGN0LrRgNCw0L3QtSDQvNC+0L3QuNGC0L7RgNCwINC4INCx0L7Q
  u9GM0YjQtSDQvdC40YfQtdCz0L4uINCY0LzQtdC90L3QviDRjdGC0L4g0L7R
  gtC70LjRh9Cw0LXRgiDQvtC60L7QvdC90YvQtSDQvNC10L3QtdC00LbQtdGA
  0Ysg0L7RgiDQtNC10YHQutGC0L7Qvy3QvNC10L3QtdC00LbQtdGA0L7Qsi4g
  0JrQvtGC0L7RgNGL0LUg0L/QvtC80LjQvNC+INGD0L/RgNCw0LLQu9C10L3Q
  uNGPINC+0LrQvdCw0LzQuCDQv9C+0LfQstC+0LvRj9GO0YIg0YDQsNCx0L7R
  gtCw0YLRjCDRgSDQvdC+0YHQuNGC0LXQu9GP0LzQuCDQuNC90YTQvtGA0LzQ
  sNGG0LjQuCwg0L/RgNC10LTQvtGB0YLQsNCy0LvRj9GO0YIg0LLQvtC30LzQ
  vtC20L3QvtGB0YLQuCDRgNCw0LHQvtGC0Ysg0YEg0YTQsNC50LvQvtCy0YvQ
  vNC4INC80LXQvdC10LTQttC10YDQsNC80Lgg0Lgg0YHQtdGC0YzRjiDQuCDR
  gi7QtC4NCg0K0KHQvtC+0YLQstC10YLRgdGC0LLQtdC90L3Qviwg0LIg0L3Q
  sNGI0YMg0LfQsNC00LDRh9GDINC/0L7RgdC70LUg0YPRgdGC0LDQvdC+0LLQ
  utC4IGF3ZXNvbWUgd20g0LLRhdC+0LTQuNGCINC10YnQtSDRg9GB0YLQsNC9
  0L7QstC60LAg0Lgg0L3QsNGB0YLRgNC+0LnQutCwINGG0LXQu9C+0LPQviDR
  gNGP0LTQsCDQv9GA0L7Qs9GA0LDQvNC8LCDQutC+0YLQvtGA0YvQtSDQv9C+
  0LfQstC+0LvRj9GCINC40YHQv9C+0LvRjNC30L7QstCw0YLRjCDQtNCw0L3Q
  vdGL0Lkg0L7QutC+0L3QvdGL0Lkg0LzQtdC90LXQtNC20LXRgCDQvdCw0YDQ
  sNCy0L3QtSDRgSDQu9GO0LHRi9C8INC00LXRgdC60YLQvtC/LdC80LXQvdC1
  0LTQttC10YDQvtC8Li4uIA==
keywords: wm,awesome,tiling
date: 2009-06-25 00:00
tags:
- wm
- awesome
---
Давно собирался написать про свое рабочее окружение в awesome wm. Но все никак не удавалось сесть и довести дело до конца. Сегодня все таки решился.

Я уже описывал на страницах блога, что это за window manager, как его устанавливать и настраивать. Выкладывал свои конфиги и предлагал решения возникающих проблем при обновлении данного оконного менеджера.

По своей сути в задачу оконного менеджера входит только управление окнами на экране монитора и больше ничего. Именно это отличает оконные менеджеры от десктоп-менеджеров. Которые помимо управления окнами позволяют работать с носителями информации, предоставляют возможности работы с файловыми менеджерами и сетью и т.д.

Соответственно, в нашу задачу после установки awesome wm входит еще установка и настройка целого ряда программ, которые позволят использовать данный оконный менеджер наравне с любым десктоп-менеджером...

Я не буду подробно останавливаться на настройке программ, а просто перечислю то, что использую каждый день в своей работе и что позволяет хотя бы немного, но упростить работу в archlinux.

Итак приступим:
<ul>
	<li>в качестве оконного менеджера используется <strong>awesome wm</strong>.</li>
	<li>в качестве меню оконного менеджера используется <strong>dmenu</strong>.</li>
	<li>в консоли использую только <strong>bash</strong>, хотя пытался как то использовать zsh, не впечатлило.</li>
	<li>терминал -- <strong>xterm</strong>, настроен на темный фон. Вообще большую часть работы осуществляю именно в консольных клиентах. Редко, но бывает, что запускаю <strong>mc</strong>.</li>
	<li>снимки экрана осуществляются с помощью <strong>scrot</strong>, вызов которой настроен на определенную комбинацию клавиш.</li>
	<li>переключение языка в раскладках -- <strong>SCIM</strong>. Великолепная программа, позволяющая работать одновременно с целым рядом раскладок, переключаясь между ними по горячим клавишам. Запоминает текущую раскладку каждого окна, позволяет игнорировать переключение в заданных программах. И не имеет проблем с горячими клавишами в различных приложениях.</li>
	<li>установка рисунка рабочего стола и быстрый просмотр изображений -- <strong>feh</strong>. В качестве альтернативной программы просмотра изображений используется <strong>Geeqie</strong>.</li>
	<li>в качестве файлового менеджера используется <strong>thunar</strong>. Эта же программа, работающая в режиме демона занимается автоматическим монтированием сменных дисков.</li>
	<li>каталог снимков -- не превзойденный <strong>F-Spot</strong>.</li>
	<li>каталог музыкальных файлов и проигрыватель -- <strong>mpd</strong>, настройка мультимедиа клавиш на клавиатуре осуществлялась с помощью <strong>mpc</strong>, а в качестве непосредственно менеджера коллекции используется <strong>sonata</strong>.</li>
	<li>прослушиваю одиночные музыкальные файлы и смотрю фильмы с помощью <strong>mplayer</strong>.</li>
	<li>просматриваю фильмы и слушаю интернет-радио с помощью <strong>vlc</strong>.</li>
	<li>в качестве редакторов текстов использую <strong>vim</strong> и <strong>emacs</strong>, редко <strong>mousepad</strong>.</li>
	<li>создание документов безусловно в <strong>OpenOffice</strong>.</li>
	<li>клиент различных im-сетей -- <strong>pidgin</strong>.</li>
	<li>альтернативный jabber-клиент -- <strong>emacs</strong>.</li>
	<li>в качестве torrent-клиента давно уже использую <strong>deluge</strong>. Ничего лучше пока не нашел.</li>
	<li>интернет-браузер -- непревзойденный <strong>Firefox</strong>. Используемые мной
  расширения можно найти на странице <a href="https://addons.mozilla.org/ru/firefox/collection/Juev_Extensions" rel="nofollow">addons.mozilla.org</a></li>
	<li>почтовый клиент -- веб-интерфейс <strong>GMail.</strong></li>
	<li>rss-менеджер -- <strong>Google Reader.</strong></li>
	<li>менеджер паролей -- <strong>keepass</strong> и <strong>lastpass</strong> в огнелисе. Причем lastpass в последнее время используется чаще всего.</li>
</ul>
Вроде все перечислил, что используется у меня в повседневной работе. Если что-то забыл -- спрашивайте! Дополню.

<strong>PS</strong>: Данная статья не претендует на аболютную истину, и является только изложением личного мнения автора, которое основано на его личном опыте.
