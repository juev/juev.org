---
layout: post
title: WordPress &amp; Amazon
keywords: wordpress,amazon,w3 total cache
date: 2010-03-03 00:00
tags:
- wordpress
- amazon
---
Уже не раз встречал информацию о том, что есть такой замечательный и дешевый сервис для хранения файлов в сети Amazon S3. Но все никак не мог собраться попробовать его в действии. Цели как таковой не было.

И вот вчера на habrahabr.ru появилась очередная заметка о том, как использовали Амазон для хранения статического контента на сайте и какой от этого получили выигрыш. Заинтересовался еще больше, полез в сеть и оказалось, что существует расширение Wordpress, которое позволяет организовать прозрачную работу WP и Amazon. Ну как тут не попробовать?

Предварительно я провел тесты работы блога без использования кэширования и со включенным
кэшированием (расширение WP Super Cache) с использованием сервиса <a
href="http://www.webpagetest.org" rel="nofollow">www.webpagetest.org</a>. Торопился и провел тесты только по одному разу, поэтому значения получились не совсем точными. 

<a href="https://static.juev.org/2010/03/main.png"><img style="border-bottom: 0px; border-left: 0px; display: block; float: none; margin-left: auto; border-top: 0px; margin-right: auto; border-right: 0px" title="WP-Super-Cache" border="0" alt="WP-Super-Cache" src="https://static.juev.org/2010/03/main_thumb.png" width="240" height="191" /></a>

Первый рисунок показывает результат при включенном кэшировании с расширением WP-Super-Cache.

<a href="https://static.juev.org/2010/03/main1.png"><img style="border-bottom: 0px; border-left: 0px; display: block; float: none; margin-left: auto; border-top: 0px; margin-right: auto; border-right: 0px" title="No Cache" border="0" alt="No Cache" src="https://static.juev.org/2010/03/main_thumb1.png" width="240" height="185" /></a> 

А вот тут произошли непонятки, оказалось, что с отключенным кэшированием блог загружается быстрее. Где именно произошла ошибка я так и не проверил. 

После проведения тестов (пусть и немного некорректных) перешел к регистрации аккаунта на <a href="http://aws.amazon.com/" rel="nofollow">Amazon</a>. Переходим по ссылке и регистрируем бесплатный Amazon Web Services Account. Достаточно указать e-mail и пароль:

<img style="border-bottom: 0px; border-left: 0px; display: block; float: none; margin-left: auto; border-top: 0px; margin-right: auto; border-right: 0px" title="amazon_aws_sign_in" border="0" alt="amazon_aws_sign_in" src="https://static.juev.org/2010/03/amazon_aws_sign_in.png" width="470" height="350" /> 

Затем указать информацию о себе. Здесь всё стандартно: данные карты или PayPal. Конечно, необходима международная карта Visa или MasterCard.

После регистрации и её подтверждения стоит зайти на страницу AWS Access Identifiers, чтобы получить специальные ключи для доступа к системе:

<img style="border-bottom: 0px; border-left: 0px; display: block; float: none; margin-left: auto; border-top: 0px; margin-right: auto; border-right: 0px" title="amazon_aws_key" border="0" alt="amazon_aws_key" src="https://static.juev.org/2010/03/amazon_aws_key.png" width="470" height="350" /> 

После чего к своему аккаунту подключаем сервис Amazon S3, который звучит как Amazon Simple Storage Service. По сути уже на этом этапе можно остановиться, и использовать только его, а можно пойти дальше и зарегистрировать дополнительно сервис Amazon CloudFront. Что он дает? В отличие от S3, в котором данные хранятся в одном хостинг-центре, в CloudFront данные распределяются между несколькими центрами по всему миру и при запросе происходит отдача с ближайшего к пользователю хостинг-центра. Что позволяет обеспечить большую скорость передачи и большую надежность хранения данных.

После добавления сервиса заходим в контрольную панель CloudFront и создаем CloudFront Distributions:

<img style="border-bottom: 0px; border-left: 0px; display: block; float: none; margin-left: auto; border-top: 0px; margin-right: auto; border-right: 0px" title="CloudFront" border="0" alt="CloudFront" src="https://static.juev.org/2010/03/CloudFront.png" width="400" height="237" /> 

В поле CNAMEs указываем синонимы доменного имени, которое будет использоваться вместо оригинального. После чего не забываем в DNS прописать саму ссылку создаваемого синонима на оригинальный домен.

Осталось дело за малым – организовать связь своего блога с созданным аккаунтом. Тут все довольно просто. 

Во-первых, отключаем все плагины кэширования, которые использовались ранее и устанавливаем расширение <a href="http://www.w3-edge.com/wordpress-plugins/w3-total-cache/" rel="nofollow">W3 Total Cache</a>. В настройках плагина включаем поддержку CDN и задаем тип Amazone CloudFront, затем переходим в соответствующую вкладку и указываем свои ключи и создаем так называемый Bucket, в котором будут храниться файлы. После чего проводим тестирование соединения и если все нормально, то последовательно загружаем данные блога на Amazon, воспользовавшись для этого соответствующими кнопками в текущей вкладке. После загрузки данных на сервера Амазона все ссылки будут автоматически изменены на сервер Амазона.

Тест блога показал следующие результаты:

<a href="https://static.juev.org/2010/03/main2.png"><img style="border-bottom: 0px; border-left: 0px; display: block; float: none; margin-left: auto; border-top: 0px; margin-right: auto; border-right: 0px" title="main" border="0" alt="main" src="https://static.juev.org/2010/03/main_thumb2.png" width="240" height="183" /></a>

На мой взгляд не плохая прибавка. Тем более, если учесть, что мой блог малопосещаемый и нагрузка по сути своей минимальная, хотя и канал отдачи сервера хостера 400 мегабит в секунду, а все таки с Амазона загрузка быстрее! Если не использовать CloudFront, то загрузка будет проходить чуть дольше, как с обычного сервера, не распараллеливая ее.

Но это еще не все. Стоимость дискового пространства на серверах Амазона минимальна. И составляет $0.150 за GB! Грех не воспользоваться.

Будем хранить резервные копии нашего блога на серверах Амазона. Для этого устанавливаем расширение <a href="http://www.wordpressbackup.org/" rel="nofollow">Automatic WordPress Backup</a>. Опять же в настройках данного расширения указываем ключи нашего аккаунта, Bucket и задаем, что именно будем сохранять, в качестве параметров можно указать резервную копию базы данных, файлы темы, загруженные файлы, расширения. Там же задаем период создания резервной копии и указываем параметры удаления старых копий. 

Перед загрузкой создается zip-архив со всеми указанными данными, после чего он автоматически отправляется на сервер Амазона. Удобно! 

В следующий раз расскажу, как использовать Amazon для хранения резервных копий документов и файлов с компьютера и синхронизации их между несколькими машинами.
