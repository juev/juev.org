---
title: "Content Security Policy with Cloudflare"
date: 2020-07-12T10:01:17+0300
image: https://static.juev.org/2020/07/logo-cloudflare-dark.svg
tags:
  - web
  - cloudflare
  - security
---
## Основные понятия

[Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) -- это стандарт компьютерной безопасности, введенный для предотвращения межсайтовых сценариев (XSS), перехвата кликов и других атак с использованием кода, возникающих в результате выполнения вредоносного содержимого в контексте доверенной веб-страницы. Первая версия стандарта была опубликована 2012 году. И первая реализация работала в Firefox версии 4, после чего ее быстро реализовали и в остальных браузерах.

Для включения CSP необходимо сконфигурировать веб-сервер для добавления HTTP-заголовков `Content-Security-Policy`. В качестве альтернативы можно использовать `<meta>` элемент, к примеру:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src https://*; child-src 'none';">
```

Описание используемых директив можно найти на странице [Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy).

## Cloudflare Workers

Если ваш сайт размещается на своем веб-сервере, нет проблем в добавлении новых HTTP-заголовков. Но если используется Github, Amazon или иной другой сервис для размещения статических сайтов, то у вас нет возможности вмешиваться в конфигурацию заголовков. И тут на помощь может прийти [Cloudflare Workers](https://workers.cloudflare.com/). При условии, что вы уложитесь в 100000 запросов за сутки, использование будет бесплатно.

Изначально проводим добавление своего корневого домена в Cloudflare, мигрируем зону и для сайтов, в которых планируем использовать проставление заголовков, включаем использование Proxy. После чего переходим к самому интересному, это созданию воркера.

При добавлении нового воркера вам будет предложено создать новое доменное имя, которое по умолчанию использует имя аккаунта, но его легко можно изменить на любой другой. Данный домен будет использоваться по умолчанию для всех ваших воркеров.

После того, как произведено создание домена, открывается страница для определения кода работы:

[![create_worker](https://static.juev.org/2020/07/worker01.png)](https://static.juev.org/2020/07/worker01.png)

В скрипт добавляем следующий код:

```js
const securityHeaders = {
        "Content-Security-Policy": "default-src 'self' static.juev.org; font-src 'self' fonts.gstatic.com; child-src 'none'; upgrade-insecure-requests",
        "Strict-Transport-Security": "max-age=1000",
        "X-Xss-Protection": "1; mode=block",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Feature-Policy": "fullscreen *"
    },
    sanitiseHeaders = {
        Server: ""
    },
    removeHeaders = [
        "Public-Key-Pins",
        "X-Powered-By",
        "X-AspNet-Version"
    ];

async function addHeaders(req) {
    const response = await fetch(req),
        newHeaders = new Headers(response.headers),
        setHeaders = Object.assign({}, securityHeaders, sanitiseHeaders);

    if (newHeaders.has("Content-Type") && !newHeaders.get("Content-Type").includes("text/html")) {
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders
        });
    }

    Object.keys(setHeaders).forEach(name => newHeaders.set(name, setHeaders[name]));

    removeHeaders.forEach(name => newHeaders.delete(name));

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
    });
}

addEventListener("fetch", event => event.respondWith(addHeaders(event.request)));
```

В `const securityHeaders` определяем необходимые заголовки, производим деплой, и в уже в параметрах нашего сайта указываем роуты для использования нового воркера:

![worket-route](https://static.juev.org/2020/07/worker-route.png)

В `Route` указываем необходимый регэксп, в воркере выбираем созданный экземпляр и определяем что будет происходить по достижению лимита. В принципе на этом все, можно проверить, что все  заработало:

```bash
$ curl -I https://www.juev.org
HTTP/2 200
date: Sun, 12 Jul 2020 08:39:17 GMT
content-type: text/html; charset=utf-8
set-cookie: __cfduid=de6d51a855ef66306676248178cb31e6c1594543156; expires=Tue, 11-Aug-20 08:39:16 GMT; path=/; domain=.juev.org; HttpOnly; SameSite=Lax; Secure
cf-ray: 5b1973e8fc878d4b-DME
last-modified: Sun, 12 Jul 2020 05:00:45 GMT
strict-transport-security: max-age=31536000; includeSubDomains; preload
cf-cache-status: DYNAMIC
cf-request-id: 03e3c6c59700008d4b78202200000001
content-security-policy: default-src 'self' static.juev.org; font-src 'self' fonts.gstatic.com; child-src 'none'; upgrade-insecure-requests
expect-ct: max-age=604800, report-uri="https://report-uri.cloudflare.com/cdn-cgi/beacon/expect-ct"
feature-policy: fullscreen *
referrer-policy: strict-origin-when-cross-origin
x-amz-id-2: 1kB+Flw6W/sTt33rCc/KRglamDtgcw9Yjt9z0AzIHmHV6Y1tlReNG0xEHnFWZk9wzcFEMVAUhuE=
x-amz-request-id: 2AAB7DD4A7BB3D3E
x-content-type-options: nosniff
x-frame-options: DENY
x-xss-protection: 1; mode=block
server: cloudflare
alt-svc: h3-27=":443"; ma=86400, h3-28=":443"; ma=86400, h3-29=":443"; ma=86400
```

Как видно, появились заголовки, что мы определяли. И если теперь проверить страницу на сайте `securityheaders.com`, то получим оценку в A+.

Та же оценка будет и в сервисе webpagetest.org, пример: [result](https://www.webpagetest.org/result/200712_3J_4c5fef7ec8adaac9ca12dbc47393aa3f/)
