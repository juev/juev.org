---
layout: post
title: Backup-Manager
keywords: daemon,services,backup,manager
date: 2009-06-07 00:00
tags:
- daemon
- services
- backup
---
Необходимость бэкапов я думаю обосновывать нет нужды.

Существует целая масса программ, которая упрощает создание и работу с бэкапами. Я в своей
практике использую <a href="http://www.backup-manager.org" rel="nofollow">backup-manager</a>. Почему? Ответ дальше...

Вольный перевод с <a href="http://www.backup-manager.org/about/" target="_self" rel="nofollow">www.backup-manager.org</a> с небольшим дополнением:
<blockquote>Backup-Manager -- это утилита для работы в командной строке, позволяющая упростить работу по ежедневному созданию копий важных данных. Написана на bash и perl, эта утилита позволяет создавать архивы во многих форматах (tar, gzip, bzip2, lzma, dar, zip) и предоставляет такие интересные возможности как передача созданных файлов по сети или автоматическая запись на CD/DVD...

Программа создана для как можно более простого использования и довольно популярна среди обычных пользователей и системных администраторов. Весь процесс резервного копирования описан в одном конфигурационном файле, который настолько прост, что для его настройки потребуется не более 5 минут. Созданные архивы хранятся указанное число дней. Каждый день, в зависимости от указанной конфигурации создается или полный бэкап или инкрементальный бекап, который только дополняет ранее созданный полный, что позволяет сократить время резервного копирования.</blockquote>

Для установки используем команду:

    $ yaourt -S backup-manager

Конфигурационный файл программы <em>/etc/backup-manager.conf</em>. Именно в нем и задаем ди параметры. Я не использую передачу по сети и не использую запись созданных архивов на диски. Основная задача, которую выполняет программа в моем случае -- это создание резервной копии в виде архиве. Фактически дубликат данных, которые примерно раз в месяц записываю на DVD...

Для выполнения поставленной задачи необходимо изменить следующие строки:

    # Where to store the archives
    export BM_REPOSITORY_ROOT="/home/juev/.backup"

Этот параметр указывает, где будут храниться создаваемые архивы.
    # For security reasons, the archive repository and the generated
    # archives will be readable/writable by a given user/group.
    # This is recommended to set this to true.
    export BM_REPOSITORY_SECURE="true"

    # The repository will be readable/writable only by a specific
    # user:group pair if BM_REPOSITORY_SECURE is set to true.
    export BM_REPOSITORY_USER="juev"
    export BM_REPOSITORY_GROUP="juev"
    # You can also choose the permission to set the repository, default
    # is 770, pay attention to what you do there!
    export BM_REPOSITORY_CHMOD="770"

Задаем основные параметры безопасности, то есть пользователя устанавливаемого на папке репозитория и права, которые будут использоваться на нем. Как видно, весь файл очень хорошо документирован, и если нет сложности с английским языком, то никаких проблем не возникнет.

    # Each archive generated will be chmoded for security reasons
    # (BM_REPOSITORY_SECURE should be enabled for this).
    export BM_ARCHIVE_CHMOD="660"

    # Number of days we have to keep an archive (Time To Live)
    export BM_ARCHIVE_TTL="5"

Эти параметры задают права на создаваемых архивах и время жизни архива. В данном случае я использую 5 дней. То есть через 5 дней архив будет удален.

    # The backup method to use.
    # Available methods are:
    # - tarball
    # - tarball-incremental
    # - mysql
    # - svn
    # - pipe
    # - none
    # If you don't want to use any backup method (you don't want to
    # build archives) then choose "none"
    export BM_ARCHIVE_METHOD="tarball-incremental"

Данный параметр используется для задания используемого метода архивации. Многое понятно из доступных вариантов.

    # Archive filename format
    #       long  : host-full-path-to-folder.tar.gz
    #       short : parentfolder.tar.gz
    export BM_TARBALL_NAMEFORMAT="long"

    # Type of archives
    # Available types are:
    #     tar, tar.gz, tar.bz2, tar.lz, dar, zip.
    # Make sure to satisfy the appropriate dependencies
    # (bzip2, dar, lzma, ...).
    export BM_TARBALL_FILETYPE="tar.gz"

Здесь задается формат, который будет использовать при архивации и формат имени файла, рекомендуется использовать именно long, чтобы при использовании архива не вспоминать, где что лежало...

    # Paths without spaces in their name:
    # export BM_TARBALL_DIRECTORIES="/etc /boot"

    # If one or more of the targets contain a space, use the array:
    declare -a BM_TARBALL_TARGETS

    BM_TARBALL_TARGETS[0]="/etc"
    BM_TARBALL_TARGETS[1]="/boot"
    BM_TARBALL_TARGETS[2]="/home/juev/Документы"

    export BM_TARBALL_TARGETS

    # Files to exclude when generating tarballs, you can put absolute
    # or relative paths, Bash wildcards are possible.
    export BM_TARBALL_BLACKLIST="/dev /sys /proc /tmp"

    # With the "dar" filetype, you can choose a maximum slice limit.
    export BM_TARBALL_SLICESIZE="1000M"

Эти параметры позволяют задать директории, которые будут использоваться при создании резервной копии. Можно задать в рамках одной переменной, тогда все директории будут помещены в один архив. Если директории будут указаны, как в примере, отдельный каталог в отдельной переменной массива, то каждый каталог помещается в отдельный файл.

BLACKLIST -- как понятно из названия позволяет указать те каталоги, которые следует пропустить при создании архива.

    # Which frequency to use for the master tarball?
    # possible values: weekly, monthly
    export BM_TARBALLINC_MASTERDATETYPE="weekly"

    # Number of the day, in the BM_TARBALLINC_MASTERDATETYPE frequency
    # when master tarballs should be made
    export BM_TARBALLINC_MASTERDATEVALUE="5"

Данные параметры позволяют задать, как часто будет создавать полная резервная копия. В приведенном примере она создается каждую пятницу недели.

Указанных параметров вполне достаточно для того, чтобы создавать резервную копию важных данных. Хорошо, если данные архивы создаются на отдельном жестком диске.

Дальше идут параметры, позволяющие задать передачу файлов по сети, или запись на CD/DVD диски сразу после создания архива, в автоматическом режиме.

Программа, которая однозначно должна найти применение на вашем компьютере!
