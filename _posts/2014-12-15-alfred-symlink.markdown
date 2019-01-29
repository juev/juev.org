---
layout: post
title: Alfred и ссылки на приложения
description:
keywords: soft, tips, osx
gplus:
published: true
date: 2014-12-15 12:16:18
image: https://static.juev.org/2014/12/alfred.png
tags:
- soft
- tips
- osx
---

В OSX помимо официального App Store для установки программ можно использовать и сторонние источники. Кроме дистрибутивов, распространяемых непосредственно самими разработчиками, можно использовать и репозитории, например MacPorts, HomeBrew.

После установки приложения из репозитория [HomeBrew](http://brew.sh/) программы размещаются не в директории Applications, а в `/usr/local/Cellar/`. И для того, чтобы разместить программу в Applications, обычно используют команду:

	brew linkapps

При этом создаются символически ссылки на собранные приложения. Запустить программу можно, но вот [Alfred](http://www.alfredapp.com/) видеть их отказывается.

Некоторые пользователи применяют решение данной проблемы в виде переноса собранного приложения в директорию Applications, вместо создания симлинков. Но более правильным решением является добавления пути, по которому размещается собранная программа в настройки Alfred, в раздел Search Scope:

![](https://static.juev.org/2014/12/alfred-1.png)

 К примеру, добавить строку:

	/usr/local/Cellar/macvim

для возможности запуска MacVim с использованием Alfred.

Данная информация представлена на официальной странице приложения: [Finding Symlinked Applications](http://support.alfredapp.com/kb:symlinked-apps).
