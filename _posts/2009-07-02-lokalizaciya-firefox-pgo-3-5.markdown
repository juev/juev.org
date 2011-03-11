--- 
layout: post
title: !binary |
  0LvQvtC60LDQu9C40LfQsNGG0LjRjyBmaXJlZm94LXBnbyAzLjU=

---
После сборки firefox-pgo задумался об локализации программы. Проблема заключается только в том, что до сих пор не обновился пакет firefox в archlinux и соответственно не обновляется пакет firefox-i18n, который отвечает за локализацию.

Однако <a href="http://forum.mozilla-russia.org/doku.php?id=firefox:faqs:localization_1.1" target="_blank">forum.mozilla-russia.org</a> быстро показал решение проблемы, путем установки нужно локали и дальнейшем переключении на нее. Перечисленно три способа. Я воспользовался первым.

<!--more-->

Далее идет цитата с указанной страницы:
<blockquote>
<h4>Способ 1</h4>
<div>
<ol>
	<li><span>Устанавливаете русификацию как расширение. Для этого переходите в меню «File», выбираете пункт «Open File…» и выбираете в появившемся окне скачанный xpi-файл.</span></li>
	<li><span>Устанавливаете расширение <a title="https://addons.mozilla.org/firefox/addon/356" onclick="return svchk()" onkeypress="return svchk()" href="https://addons.mozilla.org/firefox/addon/356">Locale Switcher</a>.</span></li>
	<li><span>Перезапускаете Firefox.</span></li>
	<li><span>Переключаете язык с помощью пункта меню «Tools → Languages».</span></li>
	<li><span>Перезапускаете Firefox.</span></li>
</ol>
</div>
<h4>Способ 2</h4>
<div>
<ol>
	<li><span>Устанавливаете русификацию как расширение. Для этого переходите в меню «File», выбираете пункт «Open File…» и выбираете в появившемся окне скачанный xpi файл.</span></li>
	<li><span>Набираете в строке адреса <em>about:config</em> и меняете значение переменной <em>general.useragent.locale</em> с <em>en-US</em> на <em>ru</em></span></li>
	<li><span>Перезапускаете Firefox.</span></li>
</ol>
</div>
<h4>Способ 3</h4>
<ol>
	<li><span>Устанавливаете русификацию как расширение. Для этого переходите в меню «File», выбираете пункт «Open File…» и выбираете в появившемся окне скачанный xpi файл.</span></li>
	<li><span>Закрываете Firefox.</span></li>
	<li>Запускаете Firefox с параметром: -UIlocale ru</li>
</ol>
</blockquote>
Все локали находятся на странице <a href="http://releases.mozilla.org/pub/mozilla.org/firefox/releases/3.5/win32/xpi/" target="_blank">releases.mozilla.org</a>. Устанавливать можно любое число нужных локалей.
