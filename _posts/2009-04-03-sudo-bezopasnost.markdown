--- 
layout: post
title: !binary |
  c3VkbyA9INCx0LXQt9C+0L/QsNGB0L3QvtGB0YLRjA==

---
В Linux вопросу безопасности уделяется очень важное место. В тоже время для управления операционной системой требуются права администратора. И раздавать пароль администратора направо и налево подобно выходу на оживленный перекресток с закрытыми глазами.

Зачем?? Если, к примеру, надо дать право запускать только одну-две команды?

Для выделения привилегированных ресурсов конкретному пользователю системы используется <strong>sudo</strong>.
<blockquote><strong>sudo</strong> (англ. <em><span lang="en" xml:lang="en">superuser [substitute user] do</span></em>, дословно «выполнить от имени <span class="mw-redirect">суперпользователя</span>») — это программа, разработанная в помощь системному администратору и позволяющая делегировать те или иные привилегированные ресурсы пользователям с ведением протокола работы. Основная идея — дать пользователям как можно меньше прав, но при этом ровно столько, сколько необходимо для решения поставленных задач.
<p style="text-align: right;">по материалам <a href="http://ru.wikipedia.org/wiki/Sudo"
rel="nofollow">Википедии</a></p>
</blockquote>
В Ubuntu <strong>sudo</strong> используется по умолчанию, при этом аккаунт администратора отключен. В других дистрибутивов sudo необходимо устанавливать. Например в Archlinux:

    $ yaourt -S sudo

После чего пакет необходимо настроить. Для этого производиться редактирование файла <strong>/etc/sudoers</strong>. Не пытайтесь редактировать его непосредственно! Для редактирования файла существует специальная команда visudo, которая вызывает текстовый редактор vi для редактирования файла <strong>/etc/sudoers</strong>, все изменения записываются во временный файл и при попытке сохранения файла производиться проверка синтаксиса, и если все нормально, то производиться замещение существующего файла новой копией, а в случае ошибки выдается предупреждение, и дается возможность исправить ошибку. Если записать файл, проигнорировав предупреждение, то получим не работающую sudo.

Сразу после установки команда sudo не доступна ни одному из пользователей. Необходимые привелегии нужно задавать в файле конфигурации. Для передачи прав администратора обычно используется группа wheel. В Archlinux после установки sudo нужно назначить группу wheel определенным пользователям:

    $ gpasswd -a user wheel

После внесения пользователя в группу, ему необходимо перелогиниться, для того, чтобы использовать возможности группы. Затем конфигурируем sudo. Вот пример моего файла:

    # sudoers file.
    #
    # This file MUST be edited with the 'visudo' command as root.
    # Failure to use 'visudo' may result in syntax or file permission errors
    # that prevent sudo from running.
    #
    # See the sudoers man page for the details on how to write a sudoers file.
    #

    # Host alias specification

    # User alias specification

    # Cmnd alias specification

    # Defaults specification

    # Runas alias specification

    # User privilege specification
    root    ALL=(ALL) ALL

    # Uncomment to allow people in group wheel to run all commands
    %wheel  ALL=(ALL) ALL

    # Same thing without a password
    # %wheel        ALL=(ALL) NOPASSWD: ALL

    %wheel  ALL = NOPASSWD: /sbin/shutdown,/sbin/poweroff,/sbin/reboot
    %wheel  ALL = NOPASSWD: /usr/bin/pacman
    %wheel  ALL = NOPASSWD: /usr/bin/pacdiffviewer,/usr/bin/pacman-color

    # Samples
    # %users  ALL=/sbin/mount /cdrom,/sbin/umount /cdrom
    # %users  localhost=/sbin/shutdown -h now

Я не задавал алиасы, которые используются для упрощения описания конфигурации. Более
подробно по конфигурации с алиасами можно посмотреть <a href="http://apicom.org.ua/blog/2009/01/09/sudo-ili-ne-sudo/" rel="nofollow">здесь</a>.

Как видно из приведенного файла конфигурации, права администратора выдаются пользователю root и группе wheel. Причем пользователи группы wheel при использовании команды sudo должны будут использовать СВОЙ пароль для подтверждения права использования привилегированных ресурсов. А в случае использовании команд shutdown, poweroff, reboot, pacman, pacdiffviewer и pacman-color ввод пароля не требуется.

Таким образом, с помощью команды sudo можно очень четко распределять привилегированные ресурсы операционной системы между различными пользователями, снижая вероятность взлома или поломки системы. При этом пользователю root можно запретить вход в систему. Что только повысит безопасность системы.

И еще, в дополнение:
<blockquote>В большинстве случаев грамотная настройка sudo делает работу от имени суперпользователя ненужной (хотя и несколько неудобной, для привыкших работать «в полную силу»).

Программу критикуют, в частности, что невозможно выполнять некоторые команды. К примеру:

    sudo cat sources.list > /etc/apt/sources.list

выдаст ошибку прав доступа (так как с правами root выполняется только процесс cat, а перенаправление выполняет <a title="Командная оболочка UNIX" href="http://ru.wikipedia.org/wiki/%D0%9A%D0%BE%D0%BC%D0%B0%D0%BD%D0%B4%D0%BD%D0%B0%D1%8F_%D0%BE%D0%B1%D0%BE%D0%BB%D0%BE%D1%87%D0%BA%D0%B0_UNIX" rel="nofollow">shell</a> с правами обычного пользователя), хотя такое можно сделать, использовав конвейер:

    cat sources.list | sudo tee /etc/apt/sources.list

так-же ничто не мешает выполнить шелл с административными правами и используя параметр шела -с выполнить взяв строку к выполнению в кавычки:

    sudo sh -c 'cat sources.list &gt; /etc/apt/sources.list'

или же попасть в шелл интерактивно аналогично работе su используя параметр -s

    sudo -s

или выполнив

    sudo sh

<p style="text-align: right;"><code>по материалам <a href="http://ru.wikipedia.org/wiki/Sudo" rel="nofollow">Википедии</a></code></p>
</blockquote>
