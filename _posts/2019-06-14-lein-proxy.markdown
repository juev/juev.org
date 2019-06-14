---
layout: post
title: "Leiningen with Proxy"
date: 2019-06-14 09:51
image:
tags:
  - clojure
  - java
  - osx
---
Попытался использовать [leiningen](https://leiningen.org/) за корпоративным фаерволом. Как результат, получил ошибки вида:

    ➜ lein repl
    Could not find artifact nrepl:nrepl:jar:0.6.0 in central (https://repo1.maven.org/maven2/)
    Could not transfer artifact nrepl:nrepl:jar:0.6.0 from/to clojars (https://repo.clojars.org/): sun.security.validator.ValidatorException: PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid certification path to requested target
    Could not find artifact clojure-complete:clojure-complete:jar:0.2.5 in central (https://repo1.maven.org/maven2/)
    Could not transfer artifact clojure-complete:clojure-complete:jar:0.2.5 from/to clojars (https://repo.clojars.org/): sun.security.validator.ValidatorException: PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid certification path to requested target
    Could not transfer artifact nrepl:nrepl:pom:0.6.0 from/to clojars (https://repo.clojars.org/): sun.security.validator.ValidatorException: PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid certification path to requested target
    Could not transfer artifact clojure-complete:clojure-complete:pom:0.2.5 from/to clojars (https://repo.clojars.org/): sun.security.validator.ValidatorException: PKIX path building failed: sun.security.provider.certpath.SunCertPathBuilderException: unable to find valid certification path to requested target
    This could be due to a typo in :dependencies, file system permissions, or network issues.
    If you are behind a proxy, try setting the 'http_proxy' environment variable.
    Could not resolve dependencies

При этом переменные `http_proxy` и `https_proxy` соответственно были выставлены ранее. Для решения проблемы потребовалось добавить CA-сертификат в java keystore. Для чего сначала необходимо определить, в какой директории размещается java, для чего используем команду:

    /usr/libexec/java_home -v 1.8

В моем случае это директория:

    /Library/Java/JavaVirtualMachines/jdk1.8.0_202.jdk/Contents/Home

После чего сохраняем CA-cert в отдельный файл на локальном диске, к примеру в директорию `~/Downloads/`. Переходим в директорию с Java keystore и проводим импорт:

    cd /Library/Java/JavaVirtualMachines/jdk1.8.0_202.jdk/Contents/Home/jre/lib/security
    sudo keytool -importcert -alias domain -file ~/Downloads/cert.crt -keystore cacerts

По умолчанию используется пароль `changeit`.

После добавления сертификата обращение во вне проходит успешно:

    ➜ lein repl
    nREPL server started on port 63173 on host 127.0.0.1 - nrepl://127.0.0.1:63173
    REPL-y 0.4.3, nREPL 0.6.0
    Clojure 1.10.0
    Java HotSpot(TM) 64-Bit Server VM 1.8.0_202-ea-b03
        Docs: (doc function-name-here)
        (find-doc "part-of-name-here")
    Source: (source function-name-here)
    Javadoc: (javadoc java-object-or-class-here)
    Exit: Control+D or (exit) or (quit)
    Results: Stored in vars *1, *2, *3, an exception in *e

    user=> (+ 2 2)
    4
    user=> Bye for now!

Таким образом при использовании OSX в корпоративной сети недостаточно проводить импорт сертификата только в системный keystore. Требуется провести так же импорт корневого сертификата во все версии Java, установленные в системе.
