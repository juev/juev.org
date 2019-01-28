---
layout: post
title: Jekyll excerpt plugin
description: 
keywords: jekyll, tips, plugin, excerpt
gplus: https://plus.google.com/116661482374124481456/posts/B7BoVX3Rjqd
published: true
date: 2012-07-05 21:22
tags:
- jekyll
- tips
- develop
---

Сегодня в очередной раз занимался изменением оформления главной страницы сайта. Я уже предпринимал попытки по внедрению отображения только кусочков текста из статей на этой странице. Но несколько раз неудачно.

Проблема заключается в том, что Jekyll не предоставляет по умолчанию инструментов для работы со структурой текста. И можно использовать только простейшие операторы выделения куска текста определенной длины.

<!--more-->

Делается это довольно просто, достаточно только использовать фильтры, что-то вроде:

{%raw%}
    {{ post.content | strip_html | truncatewords: 25 }}
{%endraw%}

Первый фильтр `strip_html` удаляет все html-теги, а второй фильтр `truncatewords` обрезает текст на 25 символе. Проблема заключается в том, что убрав все html-теги, мы фактически сливаем текст в одну массу. И на выходе получаем один параграф, в котором может содержаться кусок кода, если тот содержался в начале статьи.

Если же html-теги не убирать, то в исходной странице можно получить массу ошибок с незакрытыми тегами. Все случайно и зависит от самого содержимого страницы.

В Octopress уже присутствует дополнительный фильтр `excerpt`, который позволяет использовать в коде статьи тег:

    <!--more-->

Именно этот тег используется в Wordpress для разделения той части текста, что нужно показывать на главной от основной части текста. Для того, чтобы использовать данный фильтр в Jekyll, необходимо добавить один файл в папку `_plugins`:

{%raw%}
    # This goes in _plugins/excerpt.rb
    module Jekyll
      class Post
        alias_method :original_to_liquid, :to_liquid
        def to_liquid
          original_to_liquid.deep_merge({
            'excerpt' => content.match('<!--more-->') ? content.split('<!--more-->').first : nil
          })
        end
      end

      module Filters
        def mark_excerpt(content)
          content.gsub('<!--more-->', '<p><span id="more"></span></p>')
        end
      end
    end
{%endraw%}

После чего в коде статьи можно использовать тег `<!--more-->` для обозначения места, где необходимо сделать разделение текста.

Причем в коде шаблона для отображения статьи сайта уже можно использовать следующую конструкцию:

{%raw%}
    <!-- This snippet checks for an excerpt variable that I assign to true on my index pages, but not on the post pages, then checks to see if the post has an excerpt to see if it should render the excerpt of the post or the whole thing -->

    <div class="entry">
      {% if excerpt and post.excerpt %}
        {{ post.excerpt }}
        <p> <a href="{{ post.url }}/#more" class="more-link"><span class="readmore">Read the rest of this entry »</span></a></p>
      {% else %}
        {{ post.content | mark_excerpt }}
      {% endif %}
    </div>
{%endraw%}

Таким образом добавив один плагин, мы получаем возможность самостоятельно управлять, где именно необходимо разрывать текст для отображения его на главной странице сайта и избавляемся от возможных ошибок в коде страниц.
