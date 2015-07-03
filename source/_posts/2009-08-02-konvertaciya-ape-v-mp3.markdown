---
layout: post
title: Конвертация ape в mp3
keywords: archlinex,music,ape,mp3
date: 2009-08-02 00:00
tags:
- archlinux
- music
---
Сегодня скачал с торрента произведения Чайковского и обнаружил, что они в формате <strong>ape</strong>... Мой любимый <strong>mplayer</strong> играть их отказался, хотя в конфигурации и показывал поддержку данного формата.

Пришлось обратиться к помощи гугля. В результате стало понятно, что напрямую использовать данный формат довольно проблематично и самый простой способ использования -- это конвертация его в более удобоваримые форматы.

Нашел скрипт, который позволяет из одного ape-файла (по сути образа диска) получить целый набор треков с данного альбома в формате mp3. И затем упростил его и оптимизировал для конвертации целого набора ape-файлов.

Для использования скрипта необходимо иметь установленными пакеты <strong>mac</strong> и <strong>lame</strong>:

    $ yaourt -S mac lame

Текст скрипта:

    #!/bin/bash

    #Saving the position so as to return afterwards
    olddir="$(pwd)"

    #Going to target directory
    #cd "$(dirname "$1")"

    #Checking for the output folder. If it's not there I create it
    [ ! -d "Output" ] &amp;&amp; mkdir -p "Output"

    for file in *.ape
    do
    #Checking filetype by extension and decompressing
    tmp="$(basename "$file")"
    tmp="$&#123;tmp##*.}"

    echo -en "\033[1;32mDecompressing APE file\n\n"
    echo -en "\033[1;37m"
    tm="$(basename "$file")"
    tm="$&#123;tm%.[aA][pP][eE]}"
    out="$(mac "$file" "Output/$&#123;tm}.wav" "-d")"

    cd "Output"
    echo -en "\033[1;32m\nDecompression finished\n"
    echo -en "\033[1;32mStarting reencoding\n\n"
    echo -en "\033[1;37m"
    #Calling lame. Saving output for future checking
    out="$(lame --preset standard "$tm.wav" "$tm.mp3")"
    echo -en "\033[1;32m\nReencoding finished\n"
    echo -en "\033[1;32mSplitting\n\n"
    echo -en "\033[1;37m"
    #Using framemode becaus this settings are for VBR
    #       out="$(mp3splt -f -c "$(basename "$2")" -o "@n+-+@t" "$tm.mp3")"
    rm "$tm.wav"
    cd ..
    done

    cd "$oldir"
    echo -en "\033[1;32m\nProcessing finished successfully\n"
    echo -en "\033[1;37m"
    exit 0

Для использования данного скрипта достаточно просто его запустить в директории с ape-файлами. Создается новая директория Output, в которой будут размещены одноименные файлы, но уже в формате mp3.

Скрипт оптимизирован под использование имен файлов, включающих пробелы. Поэтому можно об этом не беспокоиться. Все временные файлы, которые образуются в результате работы скрипта, подчищаются.

Если необходимо улучшить качество mp3-файла, достаточно в строке

    out="$(lame --preset standard "$tm.wav" "$tm.mp3")"

изменить standart на extreme.
