---
title: "Создание загрузочной флешки в macOS"
date: 2025-01-20T08:49:02+0300
image: https://static.juev.org/2025/01/windiskwriter.png
tags: 
  - macos
  - windows
---

Возникла необходимость переустановить windows на одном из ноутбуков. При этом под руками были только устройства с macos
на борту.

Под windows есть целый ряд программ для создания загрузочных флешек из образов. В macos раньше это можно было сделать
с помощью boot camp, но недавно в нее внесли изменения и теперь на arm-чипах boot camp не работает. В итоге нашел
[WinDiskWriter](https://github.com/TechUnRestricted/WinDiskWriter), который позволил создать загрузочную флешку.

![windiskwriter](https://static.juev.org/2025/01/windiskwriter.png)

Поддерживает как UEFI, так и Legacy варинты загрузки. Записывал на флешку гораздо дольше, чем виндовые аналоги, но
в итоге флешка заработала.
