--- 
layout: post
title: !binary |
  0J/RgNC+0LHQu9C10LzQsCDRgSDQvtCx0L3QvtCy0LvQtdC90LjQtdC8IGF3
  ZXNvbWU=

---
На днях обновился awesome, тайловый оконный менеджер. Сегодня после того, как перезагрузил компьютер, обнаружил, что иксы не грузятся.

После приглашения slim войти в систему и ввода логина и пароля предпринимается попытка загрузки системы, которая заканчивается тем, что опять загружается slim...

Дальнейшие действия проводил в консоли... Первым делом решил проверить синтаксис конфигурационного файла awesome. Для этого дал команду awesome -k, на что получил следующее:

    $ awesome -k
    awesome: error while loading shared libraries: libxcb-keysyms.so.0: cannot open shared object file: No such file or directory</pre>

Такой ошибки я еще не встречал в своей практике. Гугль выдал 13 результатов. Первый из которых ведет на официальный форум archlinux (<a href="http://bbs.archlinux.org/viewtopic.php?id=70215&amp;p=1" rel="nofollow">ссылка</a>). Решение сводиться к тому, что нужно собирать awesome из git. Причем пакет libxdg-basedir нужно собирать почти вручную, так как по умолчанию из AUR ставиться старая версия, которая не совместима с текущей версией awesome.

Сначала последовательность команд:

    $ yaourt -Rdn awesome wicked-git
    $ cd ~/Temp
    $ mkdir awesome wicked libxdg

Первой командой удаляем установленный awesome. Затем в каталоге Temp домашней директории создаем три каталога с именами awesome wicked и libxdg (для примера, названия можете давать свои). После чего в подготовленные директории сохраняем файлы PKGBUILD, которые качаем со страниц: <a class="external text" title="http://aur.archlinux.org/packages.php?ID=13916" href="http://aur.archlinux.org/packages.php?ID=13916" rel="nofollow">awesome-git</a> и <a class="external text" title="http://aur.archlinux.org/packages.php?ID=17232" href="http://aur.archlinux.org/packages.php?ID=17232" rel="nofollow">wicked-git</a>, а в директории libxdg самостоятельно создаем файл PKGDUILD со следующим содержимым:

    #Contributor: alexandrite (puterbaugh0@gmail.com)
    # From script originally by Ondrej Martinak &lt;omartinak@gmail.com&gt;
    #Just changed pkgver and md5sum

    pkgname=libxdg-basedir
    pkgver=1.0.0
    pkgrel=1
    pkgdesc="An implementation of the XDG Base Directory specifications."
    arch=('i686' 'x86_64')
    url="http://n.ethz.ch/student/nevillm/download/libxdg-basedir"
    license=('MIT')
    depends=()
    source=(http://n.ethz.ch/student/nevillm/download/$pkgname/$pkgname-$pkgver.tar.gz)

    md5sums=('e32bcfa772fb57e8e1acdf9616a8d567')

    build() &#123;
    cd "$&#123;srcdir}/$pkgname-$pkgver"

    ./configure --prefix=/usr
    make || return 1
    make DESTDIR=$&#123;pkgdir} install
    }

Затем начинаем сборку пакетов с libxdg. Заходим в нашу подготовленную папку и даем команду <strong>makepkg</strong>. Ждем окончания сборки пакета и ставим его командой:

    $ sudo pacman -U libxdg-basedir-1.0.0-1-i686.pkg.tar.gz

Затем доставляем необходимые для сборки awesome пакеты:

    $ yaourt -S gperf asciidoc xmlto docbook-xsl

И приступаем к сборке самого awesome, перейдя в соответствующую папку и дав команду <strong>makepkg</strong>, Опять ждем окончания сборки и ставим командой:

    $ sudo pacman -U awesome-git-20090420-1-i686.pkg.tar.gz

Остается только установить wicked-git, процес тот же, то есть переходим в соответствующую папку и даем команду <strong>makepkg</strong>, по окончании сборки пакета, ставим его:

    $ sudo pacman -U wicked-git-20090420-1-i686.pkg.tar.gz

Вот теперь все! Можно спокойно логиться в иксах и наслаждаться жизнью дальше с любимым awesome...
