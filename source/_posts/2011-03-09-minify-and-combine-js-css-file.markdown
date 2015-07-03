---
layout: post
title: Juicer - комбинируем CSS и JavaScript файлы
keywords: juicer,ruby,css,javascript,webdesign
date: 2011-03-09 00:00
tags:
- javascript
- css
- webdesign
- ruby
---
Для лучшей производительности, CSS и javaScript файлы должны отдаваться с сервера как можно меньшим размером и с как можно меньшим
числом запросов.

Чтобы добиться этого рекомендуют проводить минимизацию и комбинацию файлов с помощью утилиты `Juicer`.

## Инсталяция

Для установки программы потребуется наличие установленных [Ruby](http://www.ruby-lang.org/en/ "Ruby") и
[Rubygems](http://www.rubygems.org/ "Rubygems"). После чего используем следующие команды:

    $ gem install juicer
    $ juicer install yui_compressor
    $ juicer install jslint

Первая команда может выполняться от имени пользователя или от имени root. Все зависит от тех настроек Ruby, что вы используете в
своей системе.

## CSS-files

Для уменьшения CSS-файлов достаточно использовать команду:

    $ juicer merge myfile.css myotherfile.css css/third.css

При этом `juicer` поддерживает директиву зависимостей `@import file`, замещая директиву содержимым указанного файла.

## JavaScript files

В отличие от CSS-файлов, Javascript не поддерживает зависимости. Для исправления данного недостатка была добавлена директива `@depends`, использовать ее очень просто:

    /**
     * @depends prototype.js
     * @depends widgets/lightbox.js
     */
    (function(global) {
         // Your code here
    })(this);

### Syntax verification

`juicer merge` использует [JsLint](http://www.jslint.com/ "JsLint") для проверки JavaScript-файлов на наличие ошибок. Если
ошибки или предупреждения будут обнаружены, то проц прерывается. Однако его можно будет провести принудительно, если
использовать опцию `-i`:

    $ juicer merge -i app.js
    Verifying app.js with JsLint
      Problems detected
      Lint at line 15 character 2: Missing semicolon.
      }

    Problems were detected during verification
    Ignoring detected problems
    Produced app.min.js from
      app.js

Если же вы хотите только проверить javascript-файл, можно использовать вызов:

    $ juicer verify app.js

## Мой опыт

Я использую следующие команды для обработки файлов стилей и скриптов:

    $ juicer merge -f -o _site/css/master.css _css/style.css _css/highlight.css
    $ juicer merge -f -s -o _site/js/master.js _js/jquery.min.js _js/jquery.twittertrackbacks-1.0.js _js/noteit.js

Опция `-f` используется для того, чтобы иметь возможность переписывать существующие файлы.

Опция `-o` указывает на имя результирующего файла, с указанием его местоположения.

В случае работы с javascript используется опция `-s`, позволяющая отключить проверку скриптов на наличие ошибок. Пока я не нашел
в ней особой необходимости, хотя разработчики и не рекомендуют ее использовать.

В итоге я получил один файл стиля, вмето двух, размер довольно существенно уменьшился. И еще больший прогресс я достиг при
использовании `juicer` со скриптами. Вместо трех скриптов получился один, меньшего размера.

Тест скорости загрузки страниц от Google под названием Page Speed раньше выдавал 88 балов из 100 для моего сайта. Теперь же
выдает 95 балов из 100!
