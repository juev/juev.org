---
layout: post
title: Emacs on Windows
keywords: emacs,windows
date: 2010-09-20 00:00
tags:
- emacs
- windows
---
Давно уже не использовал Emacs. Давно ничего про него не писал. Раньше, во времена использования операционной системы Linux использовал Emacs для того, чтобы попытаться в нем разобраться. Найти себя, так сказать. Вроде даже удалось...

Однако по своей сути использование Emacs сводилось только к использованию некоторых Lisp-приложений для него, типа Gnus, jabber, w3m. Как редактор я его почти и не использовал. Увы. По сути, в то время не понял его философии.

Сейчас же у меня возникла необходимость использования редактора для Lisp-кода. Везде указывается лучший вариант использование связки Emacs + Slime. Решил вернуться к истокам и начать изучать Emacs с самого начала. Но тут возникла сложность в использовании его под Windows.

Расскажу, как решал эти проблемы и как настраивал свой редактор.

Во первых, как оказалось, сборок под Win32 довольное большое число. Перепробовал их
множество, и в конце концов остановился на <a href="http://ourcomments.org/Emacs/EmacsW32.html" rel="nofollow">EmacsW32</a>. По сути обычный Emacs, но имеющий некие свои особенности, упрощающие его использование под Windows. Список патчей приведен на указанной странице.

На мой взгляд это оптимальный вариант!

Установка очень проста, и не вызовет каких-то сложностей. Но установить мало, нужно еще настроить его. В последнее время процесс настройки Emacs очень сильно упростился благодаря появлению <a href="http://github.com/technomancy/emacs-starter-kit" rel="nofollow">Emacs Starter Kit</a>.

Тут правда возникает еще одна сложность -- это использование GIT под Windows. Разбор материалов интернета указал на то, что существует два пути: использование <a href="http://code.google.com/p/msysgit/" rel="nofollow">msysgit</a> и установка <a href="http://www.cygwin.com/" rel="nofollow">Cygwin</a>, где в качестве одного из пакетов ставится GIT. Первый вариант я так и не попробовал, а вот второй с удовольствием поставил. Захотелось под рукой иметь еще и bash.

Теперь в своей домашней папке (<code>/home/username</code>) в запущенном Cygwin даем команду:

    $ git clone git://github.com/technomancy/emacs-starter-kit.git

Можно конечно и просто скачать файлы в архиве, воспользовавшись соответствующей кнопкой на странице. Но затем придется переименовывать папки, а в данном случае получаем уже все в готовом виде. Да и GIT на машине никогда лишним не бывает.

Теперь просто переносим созданную папку <code>.emacs.d</code> в папку <code>C:\Users\UserName\Application Data</code>. Теперь можно вновь запускать Emacs и наслаждаться жизнью! По умолчанию все организовано довольно удобно и изменять мало что потребуется. Если же нужно что-то добавить свое, в папке <code>.emacs.d</code> создаем файл с именем <code>UserName.el</code>, где UserName -- имя пользователя, под которым вы работаете в Windows.

Для себя я определил следующее:

    (setq make-backup-files nil) ; stop creating those backup~ files
    (setq auto-save-default nil) ; stop creating those #auto-save# files

    ;;; WINDOW SPLITING
    (global-set-key (kbd "M-2") 'split-window-vertically) ; was digit-argument
    (global-set-key (kbd "M-1") 'delete-other-windows) ; was digit-argument
    (global-set-key (kbd "M-s") 'other-window) ; was center-line

    (set-language-environment 'UTF-8)
    (setq default-input-method 'russian-computer)
    (set-selection-coding-system 'windows-1251)
    (set-default-coding-systems 'windows-1251)
    (prefer-coding-system 'windows-1251)

    (setq visible-bell nil)

    (global-set-key [(control tab)] 'previous-buffer)
    (global-set-key [(control shift tab)] 'next-buffer)

    ;; sample easy shortcuts

    (global-set-key (kbd "<f5>") 'find-file) ; Open file or dir
    (global-set-key (kbd "<f6>") 'ibuffer) ; list buffers

    (global-set-key (kbd "<f8>") 'kill-this-buffer) ; Close file

Все изменения касаются только некоторых клавиатурных комбинаций и изменения в поведении редактора (используемая кодировка, автосохранение).

Минимум изменений, максимум удобства!

Все приведенные действия касаются операционной системы Windows 7, и в других версиях Windows пути могут отличаться.

В последующих статьях хочу рассказать именно про использование Emacs в повседневной жизни. То, чего раньше я старательно избегал. И то, к чему пришел сейчас вновь!
