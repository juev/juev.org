---
layout: post
title: Facebook comments
keywords: facebook,comments,javascript,webdesign,validate
date: 2011-01-04 00:00
tags:
- facebook
- webdesign
- javascript
---
Я уже рассказывал в статье <a href="/2010/12/26/facebook-comments/">Валидация FaceBook комментариев</a> про то, как можно добавить комментарии Facebook на страницы своего сайта. Причем как сделать так, чтобы код страницы проходил валидацию на стандарты языка html. Сегодня же хочу чуть более подробно рассказать о том, как задавать определенные параметры отображения этих комментариев и какие есть средства управления размещенными комментариями.

Начну с того, как управлять параметрами размещения, к примеру, как задать определенную ширину поля. Суть размещаемого javascript-кода заключается в том, что теги <code>&lt;fb:comments&gt;</code> добавляются автоматически при обработке браузером страницы в том месте, где размещены теги <code>&lt;fb-root&gt;</code>. И для того, чтобы добавить определенные параметры отображения, необходимо только добавить строки (выделены жирным):
<pre><code>&lt;div id="fb-root"&gt;&lt;/div&gt;
&lt;script&gt;
  window.fbAsyncInit = function() &#123;
    FB.init(&#123;appId: 'you-app-code', status: true, cookie: true,
             xfbml: true});
  };
  (function() &#123;
    var c = document.createElement('script'); c.async = true;
    c.src = document.location.protocol +
      '//connect.facebook.net/en_US/all.js';
    document.getElementById('fb-root').appendChild(c);
    var e = document.createElement('fb:comments');
<strong>    e.setAttribute('width', '750');
    e.setAttribute('numposts', '10');
    e.setAttribute('publish_feed', 'true');</strong>
    document.getElementById('fb-root').appendChild(e);
  }());
&lt;/script&gt;</code></pre>

Таким образом формируются именно те параметры тега <code>&lt;fb:comments&gt;</code>, которые необходимы для формирования нужного отображения комментариев на странице сайта. 

Теперь про то, как можно управлять самими комментариями. Вот так выглядит форма комментариев, если на нее заходит администратор, обратите внимание, в правом нижнем углу появляется ссылка <strong>Administer Comments</strong>.

<a href="https://static.juev.org/2011/01/fb-comments.png"><img src="https://static.juev.org/2011/01/fb-comments-300x75.png" alt="" title="fb-comments" width="300" height="75" class="aligncenter size-medium wp-image-1305" /></a>

При нажатии на эту ссылку появляется следующее окно:

<a href="https://static.juev.org/2011/01/fb-param.png"><img src="https://static.juev.org/2011/01/fb-param-300x178.png" alt="" title="fb-param" width="300" height="178" class="aligncenter size-medium wp-image-1306" /></a>

Где и задаются соответствующие настройки доступа. 

Все комментарии, которые были уже размещены, могут быть удалены администратором. Так как форма добавления комментария появляется на странице только при использовании javascript, спам-боты до нее добраться не могут. А количество спама исходящее от людей на порядки меньше, можно и руками зачистить, занеся соответствующих личностей в черный список. 

На сколько удобна данная система комментирования в работе, я пока ничего не могу сказать. Она размещена на juev.info, но он только только оказался в индексе гугла и число посетителей близко к нулю. Естественно, что проверить систему комментирования facebook в работе мне пока так и не удалось.

Надеюсь приведенная информация будет для вас полезной.
