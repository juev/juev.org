---
layout: post
title: Отключаем слежение в кнопках Твиттера
description: 
keywords: twitter, web, button, tracking, track, dnt, social, private
gplus: https://plus.google.com/116661482374124481456/posts/5NUcMUQv1Fo
published: true
date: 2012-07-12 15:00
tags:
- twitter
- internet
- social
---

17 мая 2012 года Twitter в своем блоге[^1] заявил о том, что теперь будет следить за своими пользователями для того, чтобы рекомендовать интересные аккаунты, основываясь на страницах, которые они посетили.

[^1]: [New tailored suggestions for you to follow on Twitter](http://blog.twitter.com/2012/05/new-tailored-suggestions-for-you-to.html)

Twitter определяет, какие аккаунты читают посетители тех или иных сайтов, и на основе этого строит блок рекомендаций тем, кто часто посещает эти же интернет-ресурсы. Вместе с тем, Twitter сделал возможным отключение данной функции в настройках аккаунта пользователя, и также заявил о том, что будет поддерживать функцию DNT (Do Not Track).

<!--more-->

## Пользователям

Мы не любим, когда за нами наблюдают и собирают о нас информацию. Кто знает, что именно фиксируют кнопки Twitter на сайтах и что за информацию они собирают? Поэтому переходим на страницу [настроек](https://twitter.com/settings/account) своего аккаунта и отключаем персонализацию, если она была включена.

![twitter-settings](https://static.juev.org/2012/07/twitter-settings.png "Twitter Settings")

Это лишь дает шанс того, что информация о наших посещениях не будет собираться, но почему бы не воспользоваться?

## Разработчикам сайтов

При размещении кнопки Twitter на своем сайте, при генерации кода на странице "[Кнопки Твиттера](https://twitter.com/about/resources/buttons#tweet "Кнопки Твиттера")" можно указать дополнительную опцию "Отказаться от адаптации Twitter":

![twitter-buttons](https://static.juev.org/2012/07/twitter-buttons.png "Twitter Buttons")

Можно так же провести данное изменение вручную, достаточно на странице найти код кнопки твиттера:

    <a href="https://twitter.com/share" class="twitter-share-button">Tweet</a>
    <script>...</script>
    
И добавить в него еще один параметр `data-dnt="true"`:

    <a href="https://twitter.com/share" class="twitter-share-button" data-dnt="true">Tweet</a>
    <script>...</script>

Если подобного изменения не проводить, то кнопка твиттера будет собирать информацию обо всех пользователях, приходящих на сайт, хотят они того или не хотят. Потому, если вы беспокоитесь о своих посетителях, добавьте параметр `data-dnt="true"` к коду кнопок твиттера на своих сайтах.
