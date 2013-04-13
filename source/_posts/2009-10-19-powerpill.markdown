---
layout: post
title: Powerpill
keywords: archlinux,powerpill,aria2
date: 2009-10-19 00:00
tags:
- archlinux
- internet
---
Не могу сказать, что являлось причиной, провайдер или нагруженость серверов. Но при установке <strong>archlinux</strong> столкнулся с ситуацией, когда от возможных 250 килобайт в секунду скорости использовалось только 60 килобайт в среднем.

Эта ситуация меня очень не устраивала. И тут на глаза мне попалась утилита <strong>powerpill</strong>, которая располагается в <em>community</em>. Утилита является оберткой к <strong>pacman</strong>, но использует для загрузки файлов не <em>wget</em>, а <em>aria2</em>. То есть осуществляет это в несколько потоков. Устанавливаем ее:

    # pacman -S powerpill aria2

И настраиваем, для этого открываем в любимом редакторе файл <em>/etc/powerpill.conf</em>. Файл очень хорошо прокомментирован, поэтому подробно на нем останавливаться я не буду.

Скажу только, что я раскомментировал и указал следующие опции:

    [options]
    Aria2Bin = /usr/bin/aria2c
    Aria2Clean
    Aria2Silent
    PacmanBin = /usr/bin/pacman-color
    PacmanConf = /etc/pacman.conf
    Reflect = -l 45

Блок опций <em>aria2</em> я не трогал. Теперь для того, чтобы установить программу, нужно вместо <em>pacman</em> использовать <em>powerpill</em>, например:

    # powerpill -S zsh

Для того, чтобы <strong>powerpill</strong> использовалась в <strong>yaourt</strong>, нужно изменить файл <em>/etc/yaourtrc</em>, сняв комментарий со строки и изменив ее:

    PacmanBin /usr/bin/powerpill

После этого процесс установки системы у меня пошел гораздо быстрее!
