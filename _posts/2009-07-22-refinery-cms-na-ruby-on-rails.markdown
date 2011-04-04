--- 
layout: post
title: "Refinery - CMS \xD0\xBD\xD0\xB0 Ruby on Rails"
---
Как создавать каркас приложения я уже описывал. А сегодня рассмотрим создание типового приложения. Если быть совсем точным, то не создание, а запуск готового. И в качестве примера возьмем <a href="http://www.refinerycms.com/">Refinery</a>.

Как выглядит панель администрирования можно увидеть и попробовать в действии на <a href="http://demo.refinerycms.com/admin">этой странице</a>. На офсайте есть видео, показывающее простоту настройки и создания новых материалов в CMS.

А мы рассмотрим пока пример, как поднять Refinery CMS на локальной машине.
<!--more-->
Переходим в папку разработки и выполняем команду:
<pre><code>$ git clone git://github.com/resolve/Refinery.git test</code></pre>

В результате получим новую директорию <em>test</em>. В которой и продолжим дальнейшую работу, подготовив файл конфигурации для создания базы данных:
<pre><code>$ cd test
$ mv ./config/database.yml.example ./config/database.yml</code></pre>

Для того, чтобы не поднимать mysql-сервер, будем использовать sqlite3. Для этого подготовим ruby к использованию данной БД:
<pre><code>$ sudo gem install sqlite3-ruby unicode rmagick</code></pre>

последние два модуля нужны будут для самой CMS. Теперь изменяем файл <em>.config/database.yml</em>:
<pre><code>login: &amp;login
 adapter: sqlite3
 dbfile: db/test.db

development:
 &lt;&lt;: *login

test:
 &lt;&lt;: *login

production:
 adapter: sqlite3
 dbfile: db/test.db</code></pre>

Обращаю внимание на то, что все лишнее убрано. И в файле, который приходит с git есть ошибка в модуле production, там лишний tab есть, который мешает выполнить корректно следующие команды. Поэтому, если вы используете mysql-сервер и используете файл их репозитория, меняя только нужные значения, не забудьте исправить данную огрешность.

Теперь, находясь в папке <em>test</em> выполняем последовательно следующие команды:
<pre><code>$ rake db:create
$ rake db:schema:load
$ rake db:seed</code></pre>

Все готово к использованию! Можно запускать сервер через запуск скрипта:
<pre><code>$ ruby script/server</code></pre>

Или же использовать thin:
<pre><code>$ thin -a 127.0.0.1 start</code></pre>

Открываем браузер и переходим по адресу 127.0.0.1:3000. Где сразу же увидим форму с предложением создать администратора сайта:
<p style="text-align: center;"><a href="http://static.juev.ru/2009/07/2009-07-21-141546_1280x1024_scrot.png"><img class="aligncenter size-full wp-image-451" title="Welcome to Refinery" src="http://static.juev.ru/2009/07/2009-07-21-141546_1280x1024_scrot.png" alt="Welcome to Refinery" width="239" height="155" /></a></p>
<p style="text-align: left;">Переходим по кнопке и заполняем предложенные данные:</p>
<p style="text-align: center;"><a href="http://static.juev.ru/2009/07/2009-07-21-141554_1280x1024_scrot.png"><img class="aligncenter size-full wp-image-452" title="Login Page" src="http://static.juev.ru/2009/07/2009-07-21-141554_1280x1024_scrot.png" alt="Login Page" width="223" height="268" /></a></p>
<p style="text-align: left;">После заполнения формы, переходим на основную страницу администрирования сайта:</p>

<a href="http://static.juev.ru/2009/07/2009-07-21-141606_1280x1024_scrot.png"><img class="aligncenter size-medium wp-image-453" title="Admin Page" src="http://static.juev.ru/2009/07/2009-07-21-141606_1280x1024_scrot-300x192.png" alt="Admin Page" width="300" height="192" /></a>

Все возможности админки данной CMS можно посмотреть на видео, которое представлено на офсайте. Там же кратко показано, как задается оформление сайта. А до тех пор наша страница выглядит вот так:

<a href="http://static.juev.ru/2009/07/2009-07-21-142159_1280x1024_scrot.png"><img class="aligncenter size-medium wp-image-454" title="Main page" src="http://static.juev.ru/2009/07/2009-07-21-142159_1280x1024_scrot-300x165.png" alt="Main page" width="300" height="165" /></a>

То есть, фактически вообще без оформления. Не обращайте внимание на то, что ссылки продублированы, во время установки данной CMS я несколько раз запускал скрипты создания базы данных.

Админка очень удобна даже в том случае, если используется конфигурация по умолчанию.
