---
title: "MemcachedKeyLengthError: Key length is > 250"
date: 2021-04-11T09:53:05+0300
image: https://static.juev.org/2021/04/sentry.jpg
tags: 
  - memcache
  - sentry
  - tips
---
[Sentry](https://sentry.io) предоставляет программное обеспечение для мониторинга и отслеживания возникающих в работе ПО ошибок. Но сегодня хочу остановиться не на описании Sentry, а на настройке интеграции Sentry с LDAP (Lightweight Directory Access Protocol). 

По умолчанию в состав Sentry включаются масса адаптеров для интеграции с различными системами, но LDAP необходимо ставить и настраивать отдельно. Например используя репозиторий [Banno/getsentry-ldap-auth](https://github.com/Banno/getsentry-ldap-auth). Для установки интеграции меняем наш `Dockerfile`:

```docker
ARG BASE_IMAGE
FROM ${BASE_IMAGE}

RUN apt-get update && apt-get install -y gcc libsasl2-dev python-dev libldap2-dev libssl-dev \
    && rm -r /var/lib/apt/lists/* \
    && python3 -m pip install python-ldap sentry-ldap-auth

COPY . /usr/src/sentry

# Hook for installing additional plugins
RUN if [ -s /usr/src/sentry/requirements.txt ]; then pip install -r /usr/src/sentry/requirements.txt; fi
```

И после сборки образа и попытки использования сталкиваемся с ошибкой вида:

```plain
memcache.Client.MemcachedKeyLengthError: Key length is > 250
```

Которая возникает по причине попытки использования имени группы в виде ключа для memcached, что используется в Sentry.

Решается проблема изменением блока кода `Cache` в файле `sentry.conf.py`:

```python
import hashlib

def hash_key(key, key_prefix, version):
    new_key = ':'.join([key_prefix, str(version), key])
    if len(new_key) > 250:
        m = hashlib.sha256()
        m.update(new_key.encode('utf-8'))
        new_key = m.hexdigest()
    return new_key

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.memcached.MemcachedCache",
        "LOCATION": ["memcached:11211"],
        "TIMEOUT": 3600,
        "KEY_FUNCTION": hash_key,
    }
}
```

Повторный запуск и авторизация проходят на этот раз успешно. Спасибо [Dustin Davis](https://dustindavis.me/blog/memcachedkeylengtherror-key-length-is-250) за статью, которая помогла решить проблему.
