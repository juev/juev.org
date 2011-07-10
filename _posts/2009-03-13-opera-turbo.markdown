--- 
layout: post
title: Opera Turbo
keywords: internet,browser,opera,turbo
date: 2009-03-13
tags:
  - opera
  - internet

---
Сегодня, 13 марта 2009 года, норвежская компания, выпускающая  браузер Opera, анонсировала новую технологию под названием Opera Turbo. Данная технология уже была представлена ранее, но сегодня она стала доступна для тестирования всем нам! Подробности по <a href="http://labs.opera.com/news/2009/03/13/" rel="nofollow">ссылке</a>.

Технология Opera Turbo основана на принципе работы сервиса toonel.net, сервиса, сжимающего трафик, прогоняя его через промежуточный прокси-сервер. Только в случае toonel.net необходимо использовать либо кросплатформенное приложение написанное на java, либо специальную программу под ОС Windows. И данная программа является локальным прокси, перенаправляющим все запросы и принимающим все ответы на/от сжимающий сервер в Интернете.

В случае же с Opera Turbo все встроено в сам браузер. В левой части статусной строки есть специальный значок, указывающий на использование данной возможности. По умолчанию сервис отключен и значок серенький. Для включения достаточно щелкнуть по значку левой кнопкой мыши и он поменяет свой цвет на красный. При работе с веб-страницами в этом значке будет отображаться степень сжатия страниц и во всплывающей подсказке указывается уровень экономии трафика.

Еще одно отличие от toonel.net заключается в том, что страницы грузятся гораздо быстрее!

Сразу после того, как прочитал новость, захотел попробовать все это дело в действии. Залез в AUR Archlinux и понял, что радоваться пока рано, новой версии Opera, поддерживающей технологию сжатия в репо не оказалось. Куда деваться? Качаем уже существующий PKGBUILD и немного его модифицируем. Для упрощения я убрал desktop файл из сборки, убрал патч, который использовался в предыдущей версии и убрал иконку.

Скачать<a href="http://static.juev.ru/2009/03/pkgbuild" rel="nofollow"> PKGBUILD</a>. Содержимое файла:
<pre><code>
# Contributor: Kaos &lt; gianlucaatlas (at) gmail (dot) com &gt;
# Contributor: Julius Bullinger &lt;julius.bullinger (at) gmail.com&gt;
# Maintainer: Julius Bullinger &lt;julius.bullinger (at) gmail.com&gt;
pkgname=opera-devel-qt4
_pkgver=10.00
_build=4214
pkgver=10.00_4214
pkgrel=1
pkgdesc="The Opera web browser development and testing version, shared Qt4 version"
url="http://my.opera.com/desktopteam/blog"
license=('custom:opera')
arch=('i686')
depends=('qt' 'bash')
optdepends=('qgtkstyle-svn: to fit better in GNOME')
conflicts=('opera' 'opera-devel' 'opera-static')
provides=('opera' 'opera-devel' 'opera-static')
source=(http://snapshot.opera.com/unix/10-turbo/intel-linux/opera-10.00-4214.gcc4-qt4.i386.tar.bz2)
md5sums=()
build() &#123;
cd $&#123;startdir}/src/opera-$&#123;pkgver/_/-}.gcc4-qt4.i386/
sed 's|/usr/X11R6/lib/mozilla/plugins=1|/usr/lib/mozilla/plugins=1|' -i usr/share/opera/ini/pluginpath.ini || return 1

./install.sh DESTDIR=$&#123;startdir}/pkg
}
</code></pre>

Установка в арче проста - качаем предложеный файл в темповую папку. Затем переходим в эту папку и в консоли и даем команду:

    $ makepkg

После данной операции в папке появиться файл opera-devel-qt4-10.00\_4214-1-i686.pkg.tar.gz, который устанавливаем с помощью pacman:

    # pacman -U opera-devel-qt4-10.00_4214-1-i686.pkg.tar.gz

Теперь можно запускать программу. Увеличение скорости загрузки страниц заметно на глаз, а если кому актуален трафик - будет очень приятно наблюдать его экономию. А экономия очень существенная!
