---
layout: post
title: Jekyll – Liquid code in article
description: 
keywords: jekyll, tips, plugin, liquid
gplus: https://plus.google.com/116661482374124481456/posts/E6Qk7QVSNFF
published: true
date: 2012-07-06 00:08
tags:
- jekyll
- tips
- develop
---

Когда писал статью [Jekyll excerpt plugin](/2012/07/05/jekyll-excerpt-plugin/ "Jekyll excerpt plugin"), столкнулся в очередной раз с проблемой отображения кода, написанного на языке разметки Liquid.

Данный язык разметки используется в качестве основного в Jekyll, и потому движок воспринимает его как управляющие директивы. Что я только не делал для того, чтобы показать код на странице. В итоге остановился на варианте -- использовать gist. Это определенные кусочки кода, которые хранятся на сервере [gist.github.com](https://gist.github.com/ "Gist") и показываются с использованием JavaScript. Здесь возникает другая проблема -- для отработки JS-кода с другого сервера требуется время, то есть страницы начинают загружаться много дольше обычного. И вторая проблема заключается в том, что JS не отрабатывается в RSS-фидах. многие наверное уже успели это заметить.

<!--more-->

Промучился довольно долго, но в конце концов нашел решение и этой проблемы. Как оказалось, достаточно использовать расширение `raw_tag.rb`, которое так же создается в папке `_plugins`. Код файла:

{%raw%}
    module Jekyll
      class RawTag < Liquid::Block
        def parse(tokens)
          @nodelist ||= []
          @nodelist.clear

          while token = tokens.shift
            if token =~ FullToken
              if block_delimiter == $1
                end_tag
                return
              end
            end
            @nodelist << token if not token.empty?
          end
        end
      end
    end

    Liquid::Template.register_tag('raw', Jekyll::RawTag)
{%endraw%}

И теперь для того, чтобы отобразить код Liquid, достаточно его заключить в теги `{{"{%raw"}}%}` и `{{"{%endraw"}}%}`.

    {{"{%raw"}}%}
        {{"{{ post.content | strip_html | truncatewords: 25 "}}}}
    {{"{%endraw"}}%}

Для того, чтобы данный код воспринимался именно как код, нужно не забыть сделать для него отступ в 4 пробела. Решение очень красивое и действенное. И ведь что интересно, данное расширение давно уже храниться в коде моего сайта. Просто я раньше его так и не использовал ни разу, и совершенно про него забыл.

И еще один способ включить Liquid-код в текст своей статьи -- это экранировать его в каждой строке отдельно. Подробно сама техника описана в статье [Highlighting Liquid code in a Liquid template with Jekyll (Escape a liquid templating tag)](http://tesoriere.com/2010/08/25/liquid-code-in-a-liquid-template-with-jekyll/).

Да, и еще, как оказалось, при использовании данного способа экранировать сами теги `{{"{%raw"}}%}` и `{{"{%endraw"}}%}` уже приходиться вручную.

**PS**: Как мне указали в [комментариях к записи](https://plus.google.com/116661482374124481456/posts/E6Qk7QVSNFF), создавать новое расширение Jekyll совершенно не нужно, так как тег *raw* уже представлен в последних версиях Liquid.
