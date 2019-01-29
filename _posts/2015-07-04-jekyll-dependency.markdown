---
layout: post
title: "Jekyll: Travis и зависимости"
date: 2015-07-04 11:48
image: https://static.juev.org/2015/07/jekyll.png
tags:
  - jekyll
  - travis
---

На днях занимался обновлением стилей на своем сайте. И вчера попытался провести пробную публикацию. Очень удивился, когда получил на свою почту уведомление о том, что задача в Travis-CI выполнялась более 10 минут без какого-то вывода, поэтому была принудительно остановленна. Как выяснилось чуть позже, проблема заключается в том, что произошло обновление одной из зависимостей Jekyll.

Обновилась версия rb-gsl, что используется для работы GSL-движка, что ускоряет обработку содержимого страниц при генерации списка связанных статей. И в данном обновлении убрали явную зависимость на другую библиотеку narray, о чем, кстати предупредили при установке:

{% highlight conf %}
Installing gsl 1.16.0.6
Installing rb-gsl 1.16.0.6
Your bundle is complete!
It was installed into ./vendor/bundle
Post-install message from gsl:
gsl can be installed with or without narray support. Please install narray before and reinstall gsl if it is missing.
Post-install message from rb-gsl:
rb-gsl has been replaced by gsl
{% endhighlight %}

Исходя из чего поменял содержимое файла `Gemfile`:

{% highlight ruby %}
source "https://rubygems.org"

gem 'rake'
gem 'bundle'
gem 'jekyll'
gem 'jekyll-tagging'
gem 'compass'
gem 'rouge'
gem 's3_website'
gem 'narray'
gem 'gsl'
{% endhighlight %}

И после комита и обновления зависимостей, сборка стала работать так же быстро, как и ранее.

Можно было пойти и другим путем, просто указать те версии, что использовались до этого в списке зависимостей `Gemfile`:

{% highlight ruby %}
source "https://rubygems.org"

gem 'rake'
gem 'jekyll', '2.5.3'
gem 'jekyll-tagging', '0.6.0'
gem 'rouge', '1.8.0'
gem 's3_website', '2.8.6'
gem 'narray', '0.6.1.1'
gem 'gsl', '1.16.0.6'
{% endhighlight %}

Обратите внимание, я так же убрал ряд зависимостей, что были ранее явно описаны.

Теперь при каждом запуске сборки на сервере Travis будет устанавливаться строго заданная версия зависимости. И это значит, что каждый раз будет использоваться одно и то же сборочное окружение. Что не будет приводить к непредвиденным последствиям из-за обновления каких-нибудь зависимостей.

Travis так же поддерживает фиксацию версией зависимостей через файл `Gemfile.lock`, для этого его достаточно только внести под версионный контроль. И при этом явно указывать версии в файле Gemfile уже не нужно. Кстати, после добавления файла `Gemfile.lock`, сборка в Travis-CI стала проходить чуть быстрее.
