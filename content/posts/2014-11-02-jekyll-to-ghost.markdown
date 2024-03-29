---
title: "Ghost"
date: "2014-11-02T00:00:00+0400"
tags:
  - jekyll
  - nginx
  - ghost
keywords: jekyll, nginx, ghost
image: https://static.juev.org/2014/11/ghost_logo_big.png
---
### Миграция с Jekyll на Ghost

Jekyll интересный движок, но не без недостатков:

1. Для его запуска генерации сайта требуется Ruby, с которым в Windows есть масса проблем.
2. Для использования изображений в статье, их нужно подготовить, загрузить, получить ссылки и только затем использовать.
3. Нет возможности создавать или точнее публиковать статьи с телефона или планшета (без использования определенных хаков).

Это основные проблемы, которые вынудили меня искать другую платформу для публикации своего сайта. Попробовал [Squarespace](/2014/09/27/jekyll-to-squarespace/ "Миграция с Jekyll на Squarespace"), на который возлагал основные надежды, но от которого пришлось отказаться. И в очередной раз обратил внимание на [Ghost](http://ghost.org), который пробовал еще в момент его запуска.

Прежде чем осуществлять перенос сайта, нужно было попробовать Ghost в работе. И как оказалось, сделать это довольно просто. Достаточно было установить nodejs, после чего развернуть Ghost в отдельной директории и затем запустить локальный сервер. Не нужно устанавливать базу данных, проводить сложное конфигурирование. Достаточно только того, что описал.

После того, как на локальной машине Ghost работал, встал вопрос миграции всех статей. Практически сразу же наткнулся на [Jekyll-to-Ghost](https://github.com/mattvh/Jekyll-to-Ghost "mattvh/Jekyll-to-Ghost") – обычный плагин для Jekyll, который во время генерации сайта создает json-файл со всеми публикациями. И полученный файл используется позже во время импорта в Ghost. В отличие от Wordpress, в итоге были перенесены не только сами записи, но и вся метаинформация, то есть теги, имена ссылок и прочее.

Здесь же, на локальной машине, немного доработал тему оформления, что идет по умолчанию. И только после этого решил перенести все полученные данные на сервер.

### Установка на Ubuntu сервер

Как я уже упоминал выше, Ghost не требует для своей работы базу данных, по умолчанию используется sqlite. И все данные просто хранятся в отдельном файле. Поэтому на сервере достаточно было развернуть только nodejs:

```shell
$ sudo apt-get install python-software-properties
$ sudo apt-add-repository ppa:chris-lea/node.js
$ sudo apt-get update
$ sudo apt-get install nodejs
```

Первые две строки используются для подключения стороннего репозитория, а последующие строки это уже установка nodejs на сервер. Уточнение, данные команды используются на сервере с Ubuntu.

Я просто скопировал все файлы из рабочей директории ghost на сервер, но чтобы было понятнее, опишу, как развернуть Ghost на сервере с нуля.

Загружаем Ghost на сервер и запускаем:

```shell
$ curl -L https://ghost.org/zip/ghost-latest.zip -o ghost.zip
$ unzip -uo ghost.zip -d /path/to/ghost
$ cd /path/to/ghost
$ npm install --production
$ npm start --production
```

Обращаю внимание на то, что если вы не планируете дорабатывать Ghost своими руками, то опция `--production` во время установки и запуска обязательна.

Если все прошло нормально, то в консоли можно будет увидеть сообщение о том, что ghost запущен и доступен по адресу 127.0.0.1:2368, завершаем работу сервиса нажатием Ctrl+C и переходим к конфигурированию.

Для этого правим файл config.js в корневой директории Ghost. По сути, в данном файле можно изменить только один параметр: url, в котором указывается адрес сайта. Дополнительно к этому рекомендую настроить параметр mail, который используется для отправки на электронный адрес пароля, в случае, если он был забыт. Различные варианты конфигурирования данного параметра подробно описаны на [официальной странице](http://support.ghost.org/mail "Mail Configuration on self-hosted version of Ghost").

### Настройка Nginx

Если на сервере до их пор еще не установлен Nginx, исправляем это недоразумение:

```shell
$ nginx=stable # use nginx=development for latest development version
$ sudo add-apt-repository ppa:nginx/$nginx
$ sudo apt-get update
$ sudo apt-get install nginx
```

Теперь прописыванием конфигурацию сайта, для этого создаем новый файл в директории `/etc/nginx/sites-available/`:

```shell
$ sudo vim /etc/nginx/sites-available/sitename
```

И вносим следующее содержимое:

```nginx
    # redirect to www
    server {
      server_name  juev.ru juev.org www.juev.ru;
      rewrite ^(.*) http://www.juev.org$1 permanent;
    }

    server {
      listen 80;
      server_name www.juev.org;
      charset utf-8;

  # log settings
      access_log  /home/username/logs/juevru/access.log;
      error_log   /home/username/logs/juevru/error.log;

      # allow upload files with size ~5M
      client_max_body_size 5M;

      # robots.txt and favicon.ico from specific directory
      location ~ ^/(robots\.txt|favicon\.ico) {
	root /home/username/web/seo/;
      }

      # send images direct from nginx
  location ~ ^/(content/images/) {
    root /home/username/web/ghost;
    expires 30d;
    access_log off;
  }

      # proxy to ghost
  location / {
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header HOST $http_host;
    proxy_set_header X-NginX-Proxy true;
    proxy_pass http://127.0.0.1:2368;
  }
}
```

По возможности я прокомментировал основные блоки конфигурации, если возникнут вопросы, обращайтесь в почту.

Теперь остается только задать данную конфигурацию как рабочую:

```shell
$ sudo ln -s /etc/nginx/sites-available/sitename /etc/nginx/sites-enabled/sitename
$ sudo service nginx restart
```

Если после этого запустить ghost из его рабочей директории, к сайту уже можно будет обратиться по его адресу. Автоматизируем запуск Ghost.

### Запуск с помощью Upstart

Есть множество способов автоматизации запуска Ghost и перезапуска его в случае сбоя. Но наиболее предпочтительным является создание отдельного системного сервиса Upstart.

Для этого создаем новый файл:

```shell
$ sudo vim /etc/init/ghost.conf
```

И заполняем его:

```conf
# ghost
# description "An Upstart task to make sure that my Ghost server is always running"
# author "Denis Evsyukov"

start on startup
stop on shutdown

console none
respawn

script
  cd /home/username/web/ghost/
  exec su username -c "npm start --production"
end script
```

В данном случае нужно лишь корректно указать рабочую директорию, в которой размещается Ghost и верно прописать имя пользователя, от которого будет проводиться запуск.

После сохранения файла, появляется возможность использовать команды для запуска, остановки и перезапуска Ghost на сервере:

```shell
$ sudo start ghost
$ sudo restart ghost
$ sudo stop ghost
```

При этом, согласно заданной конфигурации, Ghost будет запускаться каждый раз во время перезагрузки сервера.

### Недостатки Ghost

Как обычно бывает, в любой бочке меда, есть минимум ложка дегтя.

Теперь у меня есть возможность публиковать статьи с любого компьютера, у которого есть доступ в Интернет. Загружать изображения непосредственно из интерфейса Ghost. Легко менять ранее созданный контент. Но:

1. В Safari на мобильном телефоне мне так и не удалось ни разу войти в админку Ghost. Только в браузере 1Password это удалось сделать.
1. При редактировании темы оформления, чтобы увидеть изменения обязательно перезапускать Ghost.
1. После перезапуска Ghost, если в данный момент времени браузер не находиться на странице админки, авторизация теряется и приходиться проходить ее вновь.
1. Нет возможности фильтрации статей по ключевым словам. В итоге, если статей много, и нужно найти определенную, чтобы ее изменить, приходиться тратить много времени.
1. До сих пор не была реализована возможность генерации sitemap.xml, из-за чего возникают проблемы с индексацией сайта на поисковых системах.
1. Не реализован поиск на сайте. Если быть более точным, пользователи уже предлагают реализацию поиска с использованием jquery, но при этом при открытии любой страницы сайта подгружается контент всего сайта, что крайне негативно сказывается на его работоспособности.

Это далеко не все из того, с чем мне пришлось столкнуться. Но я не теряю надежды, движок довольно быстро развивается, все планы отображены в [ghost-roadmap](https://trello.com/b/EceUgtCL/ghost-roadmap "Ghost Roadmap Trello"). И думаю, все, что меня не устраивает на данный момент, будет исправлено в будущем, а пока с этим можно просто смирится.

PS (21 dec 2014): в версии 0.5.6 добавили генерацию sitemap и исправили ряд проблем с производительностью, теперь и в Safari админка работает. Часть указанных проблем отпадает.
