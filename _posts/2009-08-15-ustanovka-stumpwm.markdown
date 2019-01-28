---
layout: post
title: Установка stumpwm
keywords: archlinux,wm,stumpwm,lisp,sbcl
date: 2009-08-15 00:00
tags:
- archlinux
- wm
- lisp
---
Среди tilling оконных менеджеров есть уникум, stumpwm. Отличается от всех остальных тем, что он написан на Common Lisp, в связи с чем его не просто конфигурируют, его можно сказать переписывают. Все поведение, внешний вид, все это задается с помощью программного кода на языке программирования Lisp.

Особо этот оконный менеджер любим пользователями Emacs. Так как вся настройка осуществляется как раз из него.

Однако при установке возникают ошибки, и пакет не собирается. Проблема? Да, и я попробую тут описать, как и в какой последовательности это можно сделать...

Сначала готовим базу для установки:

    $ yaourt -S clx cl-ppcre sbcl

И теперь необходимо создать в домашней директории файл <em>~/.sbclrc</em> со следующим содержимым:

    ;; This is to have clx running when sbcl begins, I think
    ;; Load ASDF first
    (require 'asdf)
    (pushnew #p"/usr/share/common-lisp/systems/" asdf:*central-registry* :test #'equal)
    (asdf:operate 'asdf:load-op 'cl-ppcre)

    ;; This is supposed to load cl-ppcre, I think
    ;; Note that ASDF has already been loaded (up above, in the CLX part).  If that is not so, uncomment the following line
    ;(require 'asdf)
    (push #p"/usr/share/common-lisp/systems/" asdf:*central-registry*)
    (asdf:operate 'asdf:load-op 'cl-ppcre)

И только теперь устанавливаем сам оконный менеджер:

    $ yaourt -S stumpwm-git

Если пропустить создание файла <em>.sbcl</em>, то сборка пакета будет не возможна...

Документация и скриншоты располагаются на официальном сайте <a href="http://www.nongnu.org/stumpwm/index.html" rel="nofollow">www.nongnu.org/stumpwm</a>

Удачных экспериментов!
