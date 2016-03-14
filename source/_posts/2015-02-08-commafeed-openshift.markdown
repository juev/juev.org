---
layout: post
title: Commafeed на бесплатном сервере OpenShift
description:
keywords: git, openshift, java
gplus:
published: true
date: 2015-02-08 08:55:28
image: https://static.juev.org/2015/02/logo_2.png
tags:
- git
- openshift
- java
---

После того, как отказался от использования платного Feedbin и перешел на Feedly, порой возникают мысли запустить свой собственный сервис. Чем и занялся на выходных.

Просмотрел целый ряд разработок с исходным кодом, и решил остановится на [commafeed](https://github.com/Athou/commafeed), потому что выглядит интересно, работает шустро и написано на java, с которой уже работаю больше года.

Так же проект меня заинтересовал тем, что позволяет запустить сервер, используя всего несколько команд:

	rhc create-app commafeed diy-0.1 mysql-5.5
	cd commafeed
	git remote add upstream -m master https://github.com/Athou/commafeed.git
	git pull -s recursive -X theirs upstream master
	git push

Что может быть проще? Предварительно устанавливаем клиент командной строки сервиса Openshift, и затем проводим регистрацию приложения, загружаем исходный код программы, и передаем на сервер, где уже автоматом проводится сборка проекта с последующим его запуском. И все это, заметьте, в бесплатном варианте! ;)

Но когда я попробовал передать на сервер код программы, получил ошибку:

	Connection to diy-evsyukov.rhcloud.com closed by remote host.
	fatal: The remote end hung up unexpectedly
	error: error in sideband demultiplexer
	To ssh://543463dbe0b8cdf4bd0005bb@diy-evsyukov.rhcloud.com/~/git/diy.git/
	   b2a1c46..6c9ba28  master -> master
	error: failed to push some refs to 'ssh://543463dbe0b8cdf4bd0005bb@diy-evsyukov.rhcloud.com/~/git/diy.git/'

Нашел тикет [New deploy on OpenShift Will not Finish](https://github.com/Athou/commafeed/issues/637), в котором автор указал, что проблема заключается в недостаточной мощности сервера OpenShift для сборки проекта.

Решил попробовать последовать совету и провести сборку на локальном компьютере. Установил JDK 8.0, Maven 3.2.5 и в отдельной директории с кодом программы запустил сборку командой:

	mvn clean package

Сборка проекта шла долго, и в результате получил заветный jar-файл в директории target. Теперь встал вопрос о том, каким образом передать его на сервер OpenShift и там запустить с указанием требуемого окружения.

Просмотрел документацию по OpenShift, как оказалось, в данном случае можно использовать только один вариант – это картридж Diy, который позволяет создавать свои собственные правила по деплою/запуску приложения. На этот раз через веб-интерфес создал новое приложение с Diy, подключил дополнительно базу данных Postgres. После чего готовый git-репозиторий выгрузил себе на локальную машину.

В данном случае репозиторий представляет собой две директории с файлом описания. Самая простейшая структура. Нам же предстоит добавить в нее директорию `.openshift` из репозитория `Athou/commafeed` и так же директорию target c результирующим файлом `commafeed.jar`.

Теперь остается только изменить скрипты в директории `.openshift/action_hooks`. В скрипте `build` комментируем последнюю строку, удаляя тем самым процес сборки:

	# mvn clean package -DskipTests -Dos.arch=x64 -s .openshift/settings.xml

В скрипт `start` добавляем строки с указанием JAVA-окружения:

	#!/bin/bash
	cd $OPENSHIFT_REPO_DIR
	export JAVA_HOME=$OPENSHIFT_DATA_DIR/jdk1.8.0_20
	export PATH=$JAVA_HOME/bin:$M2:$PATH
	nohup java -jar target/commafeed.jar server .openshift/config.mysql.yml > ${OPENSHIFT_DIY_LOG_DIR}/commafeed.log 2>&2 &

Без указания данных переменных запуск будет осуществлятся с системной версией Java, что приводит к ошибке и не работоспособности сервера.

И теперь остается изменить файл `.openshift/config.mysql.yml`, указав в нем основные настройки приложения и параметры соединения с базой данных. На настройках останавливаться не буду, они хорошо прокомментированы и понятны из контекста. Главное указать параметры соединения с базой данных:

	database:
	  driverClass: org.postgresql.Driver
	  url: jdbc:postgresql://127.7.230.130:5432/diy
	  user: adwerelhwerj
	  password: raB1mIj2Nun1
	  properties:
    	charSet: UTF-8

Необходимо указать используемый драйвер (как указывал ранее, я создавал приложение с Postgres), url, в котором указывается ip-адрес сервера с БД и имя базы данных, после чего указываем учетные данные для подключения. Все эти данные будут представлены после создания приложения в OpenShift.

Теперь добавляем файлы в репозиторий и передаем на сервер:

	git add .
    git commit -a -m "Adding files"
    git push

Запустить сервер корректно мне удалось с третьего или четвертого раза. При этом настройки доводиил до ума уже непосредственно на сервере, заходя на него по ssh:

	rhc ssh diy

OpenShift бесплатно предоставляет 3 сервера размером small. Для небольших приложений оптимально. Commafeed запустился и работал довольно шустро.

[![](https://static.juev.org/2015/02/commafeed.png)](https://static.juev.org/2015/02/commafeed.png)

Приятным дополнением является возможность изменения стилей оформления без вмешательства в исходный код темы:

[![](https://static.juev.org/2015/02/settings.png)](https://static.juev.org/2015/02/settings.png)

Но что-то у меня пока не заладилось с русским языком в статьях:

[![](https://static.juev.org/2015/02/russian.png)](https://static.juev.org/2015/02/russian.png)

При этом проблема с русским языком наблюдается во всех лентах новостей без исключения.

CommaFeed оказался приятным RSS-ридером, с быстрым откликом и гибкими настройками. Буду ли я его использовать? Время покажет, пока предстоит разобраться с русским языком.
