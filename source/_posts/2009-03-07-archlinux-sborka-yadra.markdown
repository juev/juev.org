---
layout: post
title: archlinux - сборка ядра
keywords: archlinux,kernel,build
date: 2009-03-07 00:00
tags:
- archlinux
- kernel
---
В archlinux сборка ядра довольно простое дело, причем в итоге создается установочный пакет, который затем ставится, как обычный, со всеми возможностями дальнейшего управления, такими как обновление, удаление...

Качаем исходники, я воспользовался <a href="http://mirror.yandex.ru/kernel.org/linux/kernel/v2.6/linux-2.6.27.8.tar.bz2" rel="nofollow">mirror.yandex.ru</a>.

Распаковываем их в домашней директории. Использовать системные папки не рекомендуют...

    $ cd ~/Temp
    $ tar -xjf linux-2.6.27.8.tar.bz2
    $ cd linux-2.6.27.8
    $ zcat /proc/config.gz &gt;| .config
    $ make menuconfig

Теперь конфигурируем новое ядро. Не забываем указать контролеры жесткого диска, если используется диск sata, то нужно обязательно включить scsi, также включаем все файловые системы, что используете в своей системе. Причем включаем не в виде модулей, а жестко, непсоредственно в ядро. В разделе "файловые системы" для vfat задаем codepage в 866, а iocharset в utf8, чтобы избежать проблем с кодировкой имен файлов при монтировании с использованием udev и thunar...

После конфигурации создаем в текущей папке два файла (по ссылкам их содержимое):

<a href="http://textsnip.com/1d82d2" rel="nofollow">PKGBUILD</a>

<a href="http://textsnip.com/8a6399" rel="nofollow">kernel26.install</a>

И теперь запускаем компиляцию командой `makepkg -f`.

По окончании в текущей папке будет лежать готовый к установке пакет, который ставим с использованием pacman:

    $ sudo pacman -Uf kernel26-my-2.6.27-8-i686.pkg.tar.gz

Осталось только сконфигурировать grub, для этого редактируем файл /boot/grub/menu.lst:

    # general configuration:
    timeout   5
    default   0
    color light-blue/black light-cyan/blue

    # (0) Arch Linux
    title  My Arch Linux
    root   (hd0,0)
    kernel /vmlinuz26-my root=/dev/sda3 ro quiet vga=791
    #initrd /kernel26-fallback.img

    # (1) Arch Linux
    title  Arch Linux
    root   (hd0,0)
    kernel /vmlinuz26 root=/dev/disk/by-uuid/e8cb29e8-ff8b-4f08-ae93-e7e63e27d9be ro quiet vga=791
    initrd /kernel26.img

    # (2) Arch Linux
    title  Arch Linux Fallback
    root   (hd0,0)
    kernel /vmlinuz26 root=/dev/disk/by-uuid/e8cb29e8-ff8b-4f08-ae93-e7e63e27d9be ro
    initrd /kernel26-fallback.img

Как видно, в самое начало (в нулевую позицию) добавлен блок My Arch Linux, который отвечает за загрузку нашего нового ядра. Оно же прописано для использования по умолчанию. Добавлены опции quiet для уменьшения вывода на экран во время загрузки, и включения фреймбуфера в консоли (разрешение 1024х768). Обращаю внимание на то, что в нашем новом ядре не используется образ initrd, поэтому раздел root= указывается непосредственно, без UUID, который к этому моменту еще не сгенерирован... Иначе получим сообщение об ошибке при загрузке на то, что рутовый раздел не найден...

Перезагружаем машину и наслаждаемся жизнью уже с новым ядром!
