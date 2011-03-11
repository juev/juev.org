--- 
layout: post
title: syslog-ng statistics
---
В операционной системе archlinux используется форк системы сборки системных логов syslog-ng, которая отличается более гибкой настройкой и улучшенной функциональностью.

После очередного обновления syslog-ng (довольно давно уже это произошло) в /var/log/everything.log начали периодически стали появляться следующие сообщения:
    Jan 31 23:58:23 matrix syslog-ng[3068]: Log statistics; processed='center(queued)=3822', processed='center(received)=1088', processed='destination(acpid)=0', processed='destination(console)=0', processed='destination(debug)=0', processed='destination(mail)=0', processed='destination(user)=2', processed='destination(uucp)=0', processed='destination(messages)=639', processed='destination(ppp)=0', processed='destination(news)=0', processed='destination(iptables)=0', processed='destination(everything)=997', processed='destination(lpr)=0', processed='destination(cron)=0', processed='destination(syslog)=189', processed='destination(authlog)=91', processed='destination(errors)=22', processed='destination(kernel)=695', processed='destination(daemon)=99', processed='destination(console_all)=1088', processed='source(src)=1088'

А так как это были периодические сообщения, то они забивали весь вывод tail, не позволяя нормально отслеживать системные логи. Решение было найдено в man-странице. Достаточно было в конфигурационном файле /etc/syslog-ng.conf добавить следующую строку:
    stats(0);

Таким образом получаем следующий блок в конфиге:
    #
    # /etc/syslog-ng.conf
    #

    options &#123;
    sync (0);
    time_reopen (10);
    log_fifo_size (1000);
    long_hostnames(off);
    use_dns (no);
    use_fqdn (no);
    create_dirs (no);
    keep_hostname (yes);
    perm(0640);
    group("log");
    <strong> stats(0);</strong>
    };

То, что добавили, я выделил жирным. После чего сообщения пропали. На домашней машине сообщения о статистике использования логов совершенно не нужны. В них показывается, сколько сообщений было отработано и помещено в очередь, и сколько пропущено.
