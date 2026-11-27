---
title: "Perigee в Google Play"
slug: perigee-google-play
date: 2026-11-27T17:30:00+0300
tags:
  - android
  - perigee
  - opensource
image: https://static.juev.org/2026/11/perigee-google-play-library.png
article_typography: true
---

Perigee, моя читалка для Android, теперь **[доступна в Google Play](https://play.google.com/store/apps/details?id=org.evsyukov.perigee)**. Приложение работает на Android 11 и новее.

В октябре я писал о том, как Perigee устраняет слишком широкие пробелы при выравнивании текста по ширине[^first]. С тех пор в приложении появилось чтение вслух, расширились настройки оформления, а в разделе bookOrbit стали доступны полки и коллекции.

<div class="shareding-gallery article-screenshots">
  <a href="https://static.juev.org/2026/11/perigee-google-play-library.png"><img src="https://static.juev.org/2026/11/perigee-google-play-library-preview.png" width="460" height="920" alt="Обложки книг и фильтры по статусу" loading="lazy" decoding="async"><span>Библиотека</span></a>
  <a href="https://static.juev.org/2026/11/perigee-google-play-appearance.png"><img src="https://static.juev.org/2026/11/perigee-google-play-appearance-preview.png" width="460" height="920" alt="Выбор размера шрифта на открытой странице" loading="lazy" decoding="async"><span>Настройка страницы</span></a>
  <a href="https://static.juev.org/2026/11/perigee-google-play-read-aloud.png"><img src="https://static.juev.org/2026/11/perigee-google-play-read-aloud-preview.png" width="460" height="920" alt="Кнопки управления и подсветка произносимого предложения" loading="lazy" decoding="async"><span>Чтение вслух</span></a>
</div>

Локальная библиотека по-прежнему собирается из выбранных папок. Теперь в неё можно добавлять книги и через меню Android «Поделиться»[^changes].

## Оформление страницы

Я увеличил максимальный размер шрифта с 40 до 48. Для сносок теперь можно выбрать тот же кегль, что и для основного текста. Гарнитуру, заданную в EPUB, можно заменить выбранной в настройках. Для более точной настройки есть пользовательский CSS, в котором можно задать, например, абзацные отступы[^changes].

Настройки оформления можно сохранить в профиле. Например, для чтения днём выбрать светлую схему с обычным кеглем, а для вечера сохранить тёмную с более крупным текстом. Мастер настройки позволяет подобрать размер шрифта, поля, межстрочный интервал и цветовую схему на странице открытой книги[^reading].

Линейка чтения помогает удерживать внимание на нескольких строках. Она выделяет горизонтальную полосу, положение и высоту которой можно менять. Текст за пределами полосы при желании затемняется.

## Читать и слушать

Я реализовал чтение вслух на устройстве через Android TTS. Perigee перелистывает страницы по мере чтения и может подсвечивать произносимое предложение. Воспроизведение продолжается при выключенном экране, а управлять им можно с экрана блокировки[^android-tts].

Поддержку удалённого синтеза речи добавил Константин Головко (sardigital) в PR №209. Perigee подключается к TTS-серверам с OpenAI-совместимым API. В настройках можно указать адрес сервера и ключ доступа, если он требуется, а затем выбрать голос[^remote-tts].

Я также добавил поддержку TalkBack. Страницу отрисовывает crengine, поэтому Perigee отдельно передаёт Android текст страницы и действия для навигации. Через TalkBack можно читать основной текст и сноски, перелистывать страницы и открывать меню чтения[^talkback].

## Своя библиотека на bookOrbit

Раздел bookOrbit теперь включает полки «Продолжить чтение» и «Недавно добавленные», коллекции и профиль со статистикой чтения и достижениями. На странице книги можно посмотреть описание, скачать файл и поставить оценку[^changes].

При чтении без сети Perigee сохраняет сведения о прочитанных страницах на устройстве и отправляет их на сервер после восстановления связи. Если при первой синхронизации книги позиции на устройстве и сервере различаются, приложение предлагает выбрать, с какой продолжить[^release].

С версии 0.5.1 Perigee может получить ключ синхронизации из пакета KOReader, который выдаёт bookOrbit. Если пакет доступен, для подключения достаточно войти в свой аккаунт[^release].

## Установка и обновление

APK версии 0.5.1 доступен на GitHub[^release]. У обычного APK с GitHub и версии из Google Play разные подписи. Переход между ними требует переустановки, при которой можно потерять локальные данные. Чтобы обновить приложение без переустановки, используйте тот же источник, что и раньше[^signatures].

Исходный код Perigee доступен под лицензией GPL версии 3 или новее[^code]. О проблемах с открытием книг или отображением текста можно сообщить в трекере. Если сама книга доступна для распространения, приложите файл к сообщению[^issues].

[^first]: [Perigee: своя читалка и разреженные строки](/2026/10/31/perigee-justification/).
[^release]: [Perigee 0.5.1 на GitHub](https://github.com/juev/perigee/releases/tag/v0.5.1), APK и изменения в синхронизации.
[^changes]: [Изменения от 0.1.0-rc5 до 0.5.1](https://github.com/juev/perigee/compare/v0.1.0-rc5...v0.5.1).
[^reading]: [Perigee 0.5.0](https://github.com/juev/perigee/releases/tag/v0.5.0), профили оформления, линейка и пошаговая настройка.
[^android-tts]: [PR №199](https://github.com/juev/perigee/pull/199), чтение вслух через Android TTS. [Релиз 0.5.0](https://github.com/juev/perigee/releases/tag/v0.5.0) добавил подсветку произносимых предложений.
[^remote-tts]: [PR №209](https://github.com/juev/perigee/pull/209), поддержка внешних TTS-серверов. [Константин Головко на GitHub](https://github.com/sardigital).
[^talkback]: [Текст и навигация для TalkBack](https://github.com/juev/perigee/pull/200), [поддержка сносок](https://github.com/juev/perigee/pull/202).
[^code]: [juev/perigee](https://github.com/juev/perigee), исходный код, лицензия и другие способы установки.
[^issues]: [Issues в juev/perigee](https://github.com/juev/perigee/issues).
[^signatures]: [Подписи APK и переход между сборками](https://github.com/juev/perigee/releases/tag/v0.5.0#apk-downloads).
