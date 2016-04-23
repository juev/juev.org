---
layout: post
title: mcabber - консольный jabber клиент
keywords: jabber,mcabber
date: 2009-06-04 00:00
tags:
- jabber
- mcabber
---
Согласно <a href="http://wiki.mcabber.com/index.php/RU_Main_Page" rel="nofollow">wiki.mcabber.com</a>:
<blockquote>mcabber -- это текстовый Jabber-клиенкт включающий в себя такие функции как: поддержка <strong>SSL</strong>, <strong>история переписки</strong> (конференции), <strong>автодополнение</strong> команд и возможность создания <strong>собственных команд</strong> (триггеров).</blockquote>
Он меня заинтересовал после того, как в конференции arch@conference.jabber.ru у многих из присутствующих в качестве клиента оказался именно mcabber.

Установил:

    $ yaourt -S mcabber

В репозитории archlinux находиться актуальная версия 0.9.9-1, пакет весит всего 244,35Kb. Дополнительно при установке у меня был загружен пакет libotr, а в зависимостях mcabber прописаны ncurses, glib2, openssl, gpgme, libotr, aspell...

После установки необходимо в домашней директории создать папку ~/.mcabber и скопировать в нее файл <code>/usr/share/mcabber/example/mcabberrc</code>. Для папки <code>~/.mcabber</code> задаем права доступа 0700.

    $ mkdir ~/.mcabber
    $ chmod 0700 ~/.mcabber
    $ cp /usr/share/mcabber/example/mcabberrc<tt> ~/.mcabber/mcabberrc</tt>

И затем начинаем его редактировать любимым редактором (файл по умолчанию очень хорошо документирован, проблем в настройке возникнуть не должно).
 **!!** mcabber не умеет регистрировать пользователя на сервере, поэтому данную операцию нужно провести заранее с помощью другого клиента.

Необходимый минимум, который нужно прописать (а точнее изменить в файле <tt>mcabberrc</tt>), это:

    set username = ваш jid
    set password = ваш пароль (если не указать, будет запрошен при connect)
    set server = ваш сервер
    set lang = ru

Последняя строка необходима для того, чтобы mcabber был локализован для русского языка (не обязательный параметр).

Для использования SSL прописываем следующее (только в том случае, если сервер поддерживает SSL):

    set ssl = 1
    set ssl_verify = 0

Сертификаты с сервера будут подгружены автоматически.

После запуска mcabber выглядит примерно вот так, если не менялась цветовая схема:

<img src="https://static.juev.org/2009/06/mcabber_sample.png" alt="" />

Слева -- ростер (он же лист контактов)
Правее -- окно чата.
Прямо под ним -- output статуса (системные сообщения).
И в самом низу -- input. Сюда мы вводим команды и сообщения.

Перемещение по ростеру происходит с помощью кнопок Page up/down соответственно.
Enter -- переход в состояние чата для текущего jid или конференции.
Стрелки up/down работают как в терминале (Bash history)
Ctrl+q -- следующее непрочитанное сообщение.

<em>Необходимый минимум команд</em>:

<pre><span style="font-weight: bold;">/room join "arch@conference.jabber.ru"</span>
подключение к конференции

<span style="font-weight: bold;">/help</span>
расскажет какие команды есть в mcabber, причем эта информация всегда более свежая, чем в manpage.

<span style="font-weight: bold;">/add "name@jabber.ru"</span>
добавляет "jid" в список контактов</pre>

Небольшой FAQ по программе (взято со страницы <a href="http://wiki.mcabber.com/index.php/RU_Main_Page">wiki.mcabber.com</a>):
<ol>
	<li> MCabber не хочет соединяться с сервером. Выдает ошибку: <em>jab_start: SSL negotiation failed: self signed certificate.</em>
Используйте опцию <tt>'ssl_verify = 0'</tt> в файле конфигурации и выставьте правильные опции сертификата.</li>
	<li> Как я могу подключиться к моему аккаунту на Google Talk?
Должно работать со следующими опциями:
<pre>set username = your.email@gmail.com
set server = talk.google.com
set ssl = 1
set ssl_verify = 0</pre></li>
	<li> Я хочу назначить определенную клавишу на выполнение команды, как мне узнать ее код?
Если код клавиши доступен, то он будет показан в окне истории, когда Вы нажмете нужную клавишу.</li>
	<li> Как мне создать группу пользователей?
Используйте команды <tt>/move</tt>, если указанной группы нет -- она будет создана автоматически.</li>
	<li> Как мне сделать прозрачный фон?
Установите <tt>color_background = default.</tt></li>
	<li> Могу ли я использовать PGP-шифрование?
Смотрите страницу <a title="OpenPGP" href="http://wiki.mcabber.com/index.php/OpenPGP">OpenPGP</a>.</li>
	<li>Как отключить идентифицирующую меня информацию в mcabber (показ названия и версии клиента, версии ОС и имени ресурса)?
Чтобы убрать показ поля "Name" при запросе версии клиента нужно перекомпилировать исходник, предварительно закомментировав в файле jab_iq.c строки под нимером 1510 и 1511 (для версии 0.9.6):
<pre>//xmlnode_insert_cdata(xmlnode_insert_tag(myquery, "name"), PACKAGE_NAME, -1);
//xmlnode_insert_cdata(xmlnode_insert_tag(myquery, "version"), ver, -1);</pre>
Затем, требуется прописать в конфигурационном файле:
<pre>set iq_version_hide_os = 1
set resource = myresource</pre>
Следует заметить, что значение опции resource нельзя оставить пустым: в противном случае она будет равна "mcabber".</li>
</ol>
