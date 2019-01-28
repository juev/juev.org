---
layout: post
title: 'Gentoo: USE-флаги'
keywords: gentoo,use,flags,packages
date: 2009-12-05 00:00
tags:
- gentoo
- tips
---
Одна из сложностей, с которой приходится столкнуться начинающему пользователю Gentoo -- это USE-флаги. Откуда их брать? Как прописывать? Где взять готовые списки, чтобы все было хорошо?

Дело в том, что USE-флаги задаются каждым пользователем отдельно, именно под себя. Потому найти каких-то ни было универсальных списков данных флагов просто не возможно. Но не надо отчаиваться! Есть несколько простых правил, выполняя которые мы сводим использование USE-флагов к нечто простому.

Итак, что это за правила?
<ol>
	<li>Нужно помнить, что существует минимум два конфигурационных файла, отвечающих за USE-флаги. Во-первых, это <em>/etc/make.conf</em>, в котором задаются флаги, действующие на все устанавливаемые пакеты. И во-вторых, это вручную создаваемый файл <em>/etc/portage/packages.use</em>, в котором указываются отдельные пакеты с соответствующими флагами.
Пример файла <em>/etc/portage/packages.use</em>:
<pre><code>www-client/w3m -gtk lynxkeymap
net-im/pidgin -networkmanager -gstreamer -dbus
x11-libs/vte -python
x11-misc/xbindkeys guile
app-editors/emacs -svg
xfce-base/thunar -trash-plugin -startup-notification
x11-libs/cairo glitz -xcb
media-sound/sonata -trayicon
app-office/openoffice java -pam
media-fonts/terminus-font quote ru-dv ru-i bolddiag width
net-misc/slimrat -X
x11-wm/dwm savedconfig
media-video/vlc qt4 schroedinger skins stream
sys-apps/man-pages -linguas_ru
net-libs/libsoup gnome
net-libs/libproxy gnome
net-nds/openldap sasl</code></pre>
</li>
	<li>Не нужно сразу, во время установки, пытаться создавать колоссальный по объему список глобальных флагов, так сказать про запас. Достаточно с самого начала задать к примеру следующие флаги:
<pre><code>USE="X gtk mmx sse sse2 smp ssse3 mmxext dvd alsa cdr bash-completion -gnome -kde -qt3 -qt4 -bindist -consolekit -policykit -eds"</code></pre>

Это примерный список, который в дальнейшем будем наращивать. Как видно, указываем использование gtk-интерфейса, задаем основные инструкции процессора, использование двд, звука и записи компакт-дисков, при этом отключаем гном, кде, qt-интерфейс, консолекит и полисикит.</li>
	<li>Перед установкой любого пакета проверяем флаги которые используются программой. Для этого запускаем, например для <em>bash</em>:
<pre><code>$ emerge -pv bash
These are the packages that would be merged, in order:
Calculating dependencies... done!
[ebuild   R   ] app-shells/bash-4.0_p28  USE="net nls -afs -bashlogger -examples -plugins -vanilla" 0 kB</code></pre>

Сразу видно, какие флаги используются, какие в данный момент времени включены, а какие выключены. Для того, чтобы сказать, нужен какой-то конкретный флаг или нет, необходимо знать, для чего он вообще используется. Очень удобно для этих целей использовать утилиту euse, которая входит в состав пакета gentoolkit. Рекомендую ставить этот пакет с самого начала, еще во время установки системы.
<pre><code>emerge -av gentoolkit</code></pre>

Обратите внимание, что при установке используются флаги "-av". Это позволяет перед установкой проверить флаги еще раз, посмотреть список пакетов, которые будут устанавливаться и если все нормально, после подтверждения пользователя будет осуществлена установка нужного пакета.
После установки для того, чтобы посмотреть назначение конкретного флага используется следующий вызов <em>euse</em>:
<pre><code>$ euse -i vanilla
global use flags (searching: vanilla)
************************************************************
[-    ] vanilla - Do not add extra patches which change default behaviour;
DO NOT USE THIS ON A GLOBAL SCALE as the severity of the meaning changes drastically

local use flags (searching: vanilla)
************************************************************
[-    ] vanilla (www-apache/mod_security):
Provide the original ModSecurity Core Rule Set without Gentoo-specific relaxation.
When this flag is enabled, we install the unadulterated Core Rule Set. Warning!
The original Core Rule Set is draconic and most likely will break your web applications,
including Rails-based web applications and Bugzilla.</code></pre>

Как видно описание показывает как глобальное действие флага, так и действие на конкретные пакеты. После того, как мы узнаем, что конкретно делает данный флаг, принимаем решение, использовать его в своей работе или нет.</li>
	<li>Все флаги без исключения добавляем в файл <em>/etc/portage/packages.use</em>, то есть указываем флаги только локально. Пример моего файла смотрите выше. Когда набирается большое число пакетов, анализируем их на наличие повторяющихся флагов и переносим их в <em>/etc/make.conf</em></li>
	<li>Если системы была собрана с одним набором флагов, и в дальнейшем мы принимаем решение использовать другой набор -- в этом нет ничего страшного. Производим изменение списка флагов и запускаем обновление системы:
<pre><code>emerge -auND world</code></pre>

Будет произведен анализ установленных пакетов на измененные зависимости и необходимые пакеты доставляются и пересобираются.
После чего не лишним будет выполнить очистку системы:
<pre><code>emerge -a --depclean</code></pre>

Проверяем список пакетов, который будет удален, при необходимости добавляем нужные имена файлов в файл <em>/var/lib/portage/world</em> для того, чтобы оставить их в системе и затем удаляем все то, что уже является лишним в системе.</li>
</ol>
Соблюдая эти правила довольно просто управлять списком USE-флагов не захламляя систему ненужными зависимостями. Надеюсь эта статья поможет вам ближе познакомиться с Gentoo. На деле данная операционная система довольно проста!
