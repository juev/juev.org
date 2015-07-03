---
layout: post
title: xbindkeys - сочетания в стиле emacs
keywords: xbindkeys,hotkeys,linux
date: 2009-09-13 00:00
tags:
- lisp
- tips
---
В связи с тем, что в последнее время очень часто приходиться менять оконный менеджер в связи с различными экспериментами, захотелось немного унифицировать свою систему клавиатурных комбинаций. А точнее -- сделать ее отдельной от самого оконного менеджера.

По сути, проблема решилась быстро, достаточно было только установить <em>xbindkeys</em> и настроить в нем нужные сочетания клавиш. Тем самым получаем одни и те же комбинации везде, где только можно, включая обычный <em>twm</em>.

Но захотелось большего! Обычные сочетания клавиш очень ограничены, даже если использовать разные модификаторы. Ограничены потому что большинство комбинаций уже используется в различных программах и потому, что различные операции приходиться использовать на одних и тех же модификаторах.

На мой взгляд, лучше всего данную проблему решает emacs, с его двойными/тройными комбинациями. Начиная, к примеру комбинацию с<strong> C-x</strong>, мы по сути указываем на использование системной функции (утрирую). А последующее сочетание уже говорит, что конкретно нужно сделать. Таким образом мы получаем просто потрясающее количество клавиатурных комбинаций, которые к тому же проще запоминать, так как есть определенная логика.

Естественно, задумался, как можно организовать подобное в <em>xbindkeys</em>. Где то уже встречал информацию о том, что это возможно. Только вот где? В итоге нашел. Все оказалось довольно просто. Файл конфигурации <em>xbindkeys</em> может быть описан двумя способами: в виде обычного текстового файла и на языке <em>lisp</em> (диалект <em>guile</em>). Вот как раз с помощью <em>guile</em> то все это дело и осуществляется.

Определяются три функции: <strong>first-binding</strong>, в которой определяются основные одиночные сочетания и присутствует вызов второй функции <strong>second-binding</strong>, которая отвечает за вторые комбинации в последовательности. Так же необходима функция <strong>reset-first-binding</strong> для переключения используемых режимов.

Текст моего конфига <strong>~/.xbindkeysrc.scm</strong>:

    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    ;; Start of xbindkeys guile configuration ;;
    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

    ;; List of modifier:
    ;;   Release, Control, Shift, Mod1 (Alt), Mod2 (NumLock),
    ;;   Mod3 (CapsLock), Mod4, Mod5 (Scroll).

    (define (first-binding)
      "First binding"
      (xbindkey '(XF86Calculator) "emacsclient -c -a \"\"")

      (xbindkey '(Mod1 F2) "dmenu_run")
      (xbindkey '(Mod4 F2) "dmenu_run")

      (xbindkey '(Print) "scrot -q 10")
      (xbindkey '(Mod1 Print) "scrot -q 10 -s")

      (xbindkey '(XF86Sleep) "/home/juev/.scripts/off")

      (xbindkey '(XF86AudioLowerVolume) "amixer -q set Master 5- unmute")
      (xbindkey '(XF86AudioRaiseVolume) "amixer -q set Master 5+ unmute")
      (xbindkey '(XF86AudioMute) "amixer -q sset Master toggle")

      (xbindkey '(XF86AudioPrev) "mpc prev")
      (xbindkey '(XF86AudioPlay) "mpc toggle")
      (xbindkey '(XF86AudioNext) "mpc next")

      (xbindkey-function '(Mod4 a) second-binding))

    (define (reset-first-binding)
      "reset first binding"
      (ungrab-all-keys)
      (remove-all-keys)
      (first-binding)
      (grab-all-keys))

    (define (second-binding)
     "Second binding"
     (ungrab-all-keys)
     (remove-all-keys)
     (xbindkey-function 'f
         (lambda ()
             (run-command "firefox")
             (reset-first-binding)))
     (xbindkey-function 'c
         (lambda ()
             (run-command "conkeror")
             (reset-first-binding)))
     (xbindkey-function 'g
         (lambda ()
             (run-command "gcalctool")
             (reset-first-binding)))
     (xbindkey-function 't
         (lambda ()
             (run-command "thunar")
             (reset-first-binding)))
     (xbindkey-function 'k
         (lambda ()
             (run-command "keepassx")
             (reset-first-binding)))
     (xbindkey-function 'e
         (lambda ()
             (run-command "emacsclient -c -a \"\"")
             (reset-first-binding)))
     (xbindkey-function '(control g) reset-first-binding)
     (grab-all-keys))

    (first-binding)

    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
    ;; End of xbindkeys guile configuration ;;
    ;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

Подробно расписывать, как тут и что задается, я не буду, по сути все понятно из текста. И формат вызова функций и прописывание самих комбинаций. Хочу только остановиться на том, какие комбинации тут используются для составных клавиатурных сочетаний.

В функции <em>first-binding</em> прописываются все сочетания, которые будут действовать от однократного нажатия, например, нажатие на <strong>Mod4+F2</strong> вызывает программу <strong>dmenu_run</strong>. Нажатие на <strong>Mod4+a</strong> вызывает функцию <em>second-binding</em>, в которой прописываются дополнительные сочетания. К примеру нажатие на <strong>Mod4+a f</strong> запускает огнелис. Если нажимаем на <strong>Mod4+a</strong>, xbindkeys начинает воспринимать <strong>только те</strong> комбинации, что прописаны в функции <em>second-binding</em>. Если нужно вернуться к базовому функционалу без использования программ описанных в данной функции, жмем <strong>C-g</strong>.

Я выбрал комбинацию <strong>Mod4+a</strong>, потому что она была не занята. Первоначально прописал <strong>C-t</strong>, как это используется в некоторых менеджерах окон, но столкнулся с тем, что нужно было еще прописывать функцию для передачи сочетания <strong>C-t</strong> активной программе. Проще оказалось сменить используемую комбинацию.
