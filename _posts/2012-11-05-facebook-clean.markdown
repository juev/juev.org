---
layout: post
title: Укрощение Facebook
description: 
keywords: facebook, style, stylish, safari, ads, clean
gplus: https://plus.google.com/116661482374124481456/posts/a7NR3e26UTF
published: true
date: 2012-11-05 14:35
tags:
- facebook
- web
- safari
- stylish
---

На страницах сайтов часто размещают массу информации, которая совершенно не нужна обычному человеку. Это и реклама и различные предложения. Я уже описывал, как можно избавиться от рекламы на страницах Gmail ("[Блокируем элементы с помощью таблицы стилей](/2012/08/11/safari-userstyles/)"). И несколько дней назад решил в очередной раз зарегистрироваться на facebook.

Раньше было довольно сложно с ним работать, потому что реклама занимала много пространства, но теперь стало совершенно невозможно. Как люди работают с facebook, не понимаю?

[![facebook](https://static.juev.org/2012/11/th-facebook.png)](https://static.juev.org/2012/11/facebook.png "Facebook")

Основную долю экрана занимает предложение добавить себе в друзей людей, которых я вижу в первый раз в жизни. Часть занято рекламой. И лишь в центре внизу есть то, за чем я сюда пришел. Крайне не рационально!

Так как я пользуюсь Safari, то использовал расширение "[Stylish for Safari](http://sobolev.us/stylish/ "Stylish for Safari")". Для Firefox и Chrome есть одноименные расширения. Затем используя web-инспектор браузера, определил, какие именно элементы необходимо убирать с экрана. И добавил несколько правил в расширение. Стало намного лучше.

Затем изменил ширину вывода текста сообщений, после чего обратил внимание на левую боковую панель, на которой рисовалась куча ссылок, которые мне совершенно не нужны. Часть приожений (например заметки и фотографии) я вынес в раздел Избранное, а все остальное скрыл по тому же самому принципу, что и остальные элементы.

Код стилей для Facebook у меня получился следующим:

    .rhcFooter, .homeSideNav#connectNav, .homeSideNav#appsNav, #rightCol, .megaphone_story_wrapper { display: none !important; }
    #boulder_fixed_header { width: 655px !important; }
    #contentArea, #pagelet_composer { width: 755px !important; }

И после всех изменений Facebook стал выглядеть следующим образом:

[![facebook-clean](https://static.juev.org/2012/11/th-facebook-clean.png)](https://static.juev.org/2012/11/facebook-clean.png "Facebook Clean")

На мой взгляд, стало намного лучше! Надеюсь, что Mark Zuckerberg не обидится.
