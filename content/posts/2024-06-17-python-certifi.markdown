---
title: "Python SSL error"
date: 2024-06-17T19:25:04+0300
image: https://static.juev.org/2024/06/python.png
tags: 
  - macos
  - python
---

Возникла необходимость из консоли поработать с S3 диском. В macOS через homebrew установил s3cmd и попытался
сконфигурировать:

```sh
s3cmd --configure
```

Заполнил все параметры, и во время проверки подключения поймал ошибку:

```plain
ERROR: Test failed: [SSL: CERTIFICATE_VERIFY_FAILED] certificate verify failed: unable to get local issuer certificate (_ssl.c:1000)
```

Стал разбираться, что происходит? В зависимостях s3cmd указан `python@3.12`.

Поиски в интернете показали, что у питона своя собственная ключница. И в запросах
возникает ошибка валидации сертификата. Предлагалось множество различных решений. Но перепробовав целый ряд нашел одно.

Требуется установить дополнительный пакет `certifi`:

```sh
brew install certifi
```

Затем определяем переменные окружения, для bash:

```bash
CERT_PATH=$(python3 -m certifi)
export SSL_CERT_FILE=${CERT_PATH}
export REQUESTS_CA_BUNDLE=${CERT_PATH}
```

Я использую fish, для него определяется несколько иначе:

```bash
set CERT_PATH $(python3 -m certifi)
export SSL_CERT_FILE={$CERT_PATH}
export REQUESTS_CA_BUNDLE={$CERT_PATH}
```

После определения переменных запросы начинают проходить без ошибок.
