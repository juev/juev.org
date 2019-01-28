---
layout: post
title: Оптимизация работы MySQL-сервера
keywords: vps,mysql,оптимизация,настройка
date: 2010-11-22 00:00
tags:
- vps
- mysql
---
После того, как перешел на Linode, я mysql-сервер установил, и с тех пор его не трогал. Возникали проблемы с нехваткой памяти во время стресс-нагрузки, но я никак не мог связать, с чем именно это происходило.

Помогло то, что установил memcache на сервере. Проблема исчезла, но в последнее время стало сильно удручать то, что на сервере работает очень много сторонних сервисов, которые были установлены для решения ряда проблем, но которые не выполняют те задачи, для которых они были напрямую предназначены. Решил понемногу избавляться от них.

Стал искать корень проблемы нехватки памяти. Наткнулся на скрипт <a href="http://mysqltuner.pl/mysqltuner.pl" rel="nofollow">mysqltuner.pl</a>, позволяющий оценить оптимальность выбранных настроек mysql-сервера.

Первый же запуск показал, что 512 мегабайт оперативной памяти явно недостаточно для выбранной конфигурации mysql-сервера. Требовалось либо менять конфигурацию, либо увеличивать размер оперативной памяти. Как оказалось в дальнейшем, в комплект поставки mysql-сервера входят несколько конфигурационных файлов, которые можно найти в каталоге <code>/usr/share/doc/mysql-server-5.1/examples/</code> для операционной системы Ubuntu.

В каталоге лежат следующие файлы:
<ul>
	<li>my-small.cnf — для систем с малым обьемом памяти (&lt; =64Mb), в которых MySQL используется редко.</li>
	</li><li>my-medium.cnf — если памяти мало (32-64Mb) или MySQL используется совместно с другими приложениями (например Apache) и памяти около 128Mb.</li>
	<li>my-large.cnf, my-huge.cnf — для систем с большим обьемом памяти (512Mb, 1-2Gb), где MySQL играет главную роль.</li>
	<li>my-innodb-heavy-4G.cnf — 4Gb памяти, InnoDB, MySQL играет главную роль.</li>
</ul>

Использовать файл <code>my-small.cnf</code> не представлялось необходимым, так как свободная оперативная память присутствовала, и сервер планировалось использовать несколько более активно, чем на встраиваемых системах.

Попытка использования файла <code>my-large.cnf</code> показало нехватку оперативной памяти. Таким образом остановил свой выбор на конфигурации представленной в файле <code>my-medium.cnf</code>. Единственно, чего я не понял, так это то, что представленная конфигурация у меня не заработала. пришлось искать тот же самый файл в интернете. И как оказалось, в рабочей конфигурации отличаются имена используемых параметров. Не понимаю, почему в поставке самого сервера присутствуют файлы конфигурации, которые к нему не подходят?

Главное, что удалось запустить сервер с новыми параметрами, скрипт <a href="http://mysqltuner.pl/mysqltuner.pl" rel="nofollow">mysqltuner.pl</a> больше не показывал на недостаток оперативной памяти. И стал выдавать примерно следующее:

    -------- General Statistics --------------------------------------------------
    [--] Skipped version check for MySQLTuner script
    [OK] Currently running supported MySQL version 5.1.41-3ubuntu12.7-log
    [OK] Operating on 32-bit architecture with less than 2GB RAM

    -------- Storage Engine Statistics -------------------------------------------
    [--] Status: -Archive -BDB -Federated -InnoDB -ISAM -NDBCluster
    [--] Data in MyISAM tables: 15M (Tables: 108)
    [!!] Total fragmented tables: 10

    -------- Performance Metrics -------------------------------------------------
    [--] Up for: 6m 11s (1K q [4.674 qps], 212 conn, TX: 4M, RX: 285K)
    [--] Reads / Writes: 95% / 5%
    [--] Total buffers: 160.0M global + 1.6M per thread (151 max threads)
    [OK] Maximum possible memory usage: 395.9M (79% of installed RAM)
    [OK] Slow queries: 1% (18/1K)
    [OK] Highest usage of available connections: 7% (11/151)
    [OK] Key buffer size / total MyISAM indexes: 16.0M/10.9M
    [OK] Key buffer hit rate: 99.8% (242K cached / 454 reads)
    [OK] Query cache efficiency: 40.3% (522 cached / 1K selects)
    [OK] Query cache prunes per day: 0
    [OK] Sorts requiring temporary tables: 0% (0 temp sorts / 225 sorts)
    [!!] Temporary tables created on disk: 35% (187 on disk / 526 total)
    [OK] Thread cache hit rate: 94% (11 created / 212 connections)
    [OK] Table cache hit rate: 25% (135 open / 535 opened)
    [OK] Open file limit used: 26% (267/1K)
    [OK] Table locks acquired immediately: 100% (958 immediate / 958 locks)

    -------- Recommendations -----------------------------------------------------
    General recommendations:
        Run OPTIMIZE TABLE to defragment tables for better performance
        MySQL started within last 24 hours - recommendations may be inaccurate
        When making adjustments, make tmp_table_size/max_heap_table_size equal
        Reduce your SELECT DISTINCT queries without LIMIT clauses
    Variables to adjust:
        tmp_table_size (> 128M)
        max_heap_table_size (> 128M)

Указывается на фрагментированность таблиц баз данных, и на использование временных файлов на жестком диске. Первое решается путем оптимизации таблиц базы данных в панели <code>phpmyadmin</code>. А второе уже не так страшно.

После того, как я оптимизировал параметры конфигурации в соответствии с рекомендациями скрипта <a href="http://mysqltuner.pl/mysqltuner.pl" rel="nofollow">mysqltuner.pl</a>, мне удалось избавиться от <code>memcache</code>, при этом в нагрузке уже не происходило потребление всей доступной оперативной памяти. И скорость работы системы несколько увеличилась. Особенно заметно это стало в админке блога, на глаз видно, что открываться страницы стали быстрее.

Стоит еще отключить использование таблиц InnoDB, BDB за счет включения следующих строк в
секцию `[mysqld]`:

    skip-innodb
    skip-bdb

Осталось еще поэкспериментировать со значением переменных

    query_cache_size (> 16M)
    tmp_table_size (> 128M)
    max_heap_table_size (> 128M)

Посмотрим, к чему это приведет! А главное, что я для себя вынес из данного эксперимента, не стоит останавливаться на полпути, и нужно разбираться во всем, что касается работы сервера!
