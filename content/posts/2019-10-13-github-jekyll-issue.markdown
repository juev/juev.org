---
title: "Проблема с Github Pages"
date: "2019-10-13T11:03:00+0300"
tags:
  - github
  - jekyll
---
Как обычно по субботам, написал статью и попытался ее опубликовать. Был удивлен, когда на почту упало сообщение от Github о том, что сборка сайта завершилась с ошибкой.

Проблема Github Pages заключается в том, что логи сборки недоступны. И что конкретно произошло, неизвестно. Отписал в поддержку и в течение нескольких часов получил ответ, в котором процитировали ошибку:

```
Timezone: "Europe/Moscow"
            Source: /page-build/repo
       Destination: /page-build/site-source-pagesjekyll-ftw
             Error: A Liquid tag in the excerpt of _pages/articles.html couldn't be parsed.
             Error: could not read file /page-build/repo/_pages/articles.html: undefined method `ancestors' for nil:NilClass
  Conversion error: Jekyll::Converters::Markdown encountered an error while converting '_posts/2012-04-29-ssh-tunnel.markdown':
                    Rouge::Guesser::Ambiguous
             Fatal: Rouge::Guesser::Ambiguous
                    Ambiguous guess: can't decide between ["xml", "mason"]
```

И посоветовали обратиться к документации. Проблема возникла в Rouge, который обеспечаивает подсветку синтаксиса блоков кода. Странность в том, что я помимо публикации новой статьи больше ничего не предпринимал.

Попытался отколючать rouge, как указывалось в ряде статей: [Disable Jekyll’s default syntax highlighter Rouge](https://medium.com/@vilcins/disable-jekylls-default-syntax-highlighter-rouge-12130ccac779) и [Disable the Rouge - Jekyll's default syntax highlighter](https://mycyberuniverse.com/disable-rouge-syntax-highlighter.html). Но, как оказалось это не помогало.

В официальной документации [Github Pages](https://help.github.com/en/articles/about-github-pages-and-jekyll) указывается на то, что у них есть ряд опций, которые изменить нельзя. И к ним относятся настройки подсветки синтаксиса.

Решил попробовать решить проблему иначе. А именно, отключил использование Github Pages, переконфигурировал свой блог на откоючение Rouge, настроил Github Actions для сборки и деплоя. И только в этом случае публикация прошла успешно.

Время сборки незначительно увеличилось, так как теперь дополнительно при каждой публикации готовиться окружение. Но в то же время, теперь у меня есть перед глазами логи каждой публикации, и я знаю что происходит каждый раз. Более того, теперь версия jekyll у меня прибита гвоздями. И буду проводить ее обновление только в том случае, если это потребуется. И буду проводить сам, без влияния сторонних организаций.

И да, теперь пора мигрировать на другой движок. Только какой? Думаю.
