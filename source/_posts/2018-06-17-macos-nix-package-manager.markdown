---
layout: post
title: "MacOS: Nix Package manager"
date: 2018-06-17 11:17
image: 
tags: 
  - osx
  - soft
  - nix
---

В MacOS уже стал стандартом дефакто пакетный менеджер Homebrew. Который позволяет установить и использовать довольно большое количество стороннего программного обеспечения. Но сегодня речь пойдет не о нем, а о другой разработке: [NixOS](https://nixos.org "NixOS") с его пакетным менеджером nix.

Особенностью его является то, что можно каждый пакет имеет имя, в котором участвует хеш-сумма его исходников. В итоге каждая версия программы имеет свое собственное имя, что позволяет их использовать независимо друг от друга. То есть установить в системе Firefox версии 53 и одновременно еще пару версий. И затем переключаться между ними, или использовать для определенных пользователей свою версии.

Кроме того, если в обычных пакетных менеджерах существует проблема в определении зависимостей, а точнее версий этих зависимостей, то теперь, из-за того, что мы имеем возможность ставить любые версии любой программы, проблема с определением зависимостей уходит.

Помимо того, что есть уже дистрибутивы NixOS, пакетный менеджер можно установить на системы Linux или OSX. Делается это довольно просто, описание присутствует на официальной странице документации: [Installing a Binary Distribution](https://nixos.org/nix/manual/#ch-installing-binary). В простейшем случае все сводится к выполнению команды:

    $ bash <(curl https://nixos.org/nix/install)

После чего создается директория `/nix` в корне файловой системы и создаются все необходимые симлинки в домашнюю директорию пользователя. К слову, вся система nix держится именно на симлинках. И переключение между версиями и профилями производиться с помощью этих ссылок.

Теперь можно начинать использовать nix. Перезапускаем консоль и запускаем поиск пакетов:

    $ nix-env -qa | grep rust
    parallel-rust-0.11.3
    perl-Pod-Coverage-TrustPod-0.100005
    python2.7-trustme-0.4.0
    python3.6-trustme-0.4.0
    rust-bindgen-0.37.0
    rust-cbindgen-0.6.0
    rust-src
    rustc-1.26.2
    rustfmt-0.9.0
    rustup-1.11.0
    rust_cargo-vendor-0.1.13
    rust_carnix-0.7.2
    uncrustify-0.67
    vimplugin-deoplete-rust-2017-07-18
    vimplugin-rust-vim-2018-01-15

Для установки достаточно использовать команду:

    $ nix-env -i rustc
    installing 'rustc-1.26.2'
    these paths will be fetched (91.33 MiB download, 448.96 MiB unpacked):
      /nix/store/iilh77wdmhrb01rb7l8gpqsrpcsrll9q-rustc-1.26.2-doc
      /nix/store/m9lapiddi7k74q3wqhk4hs1mg64g64pw-rustc-1.26.2
      /nix/store/rndszwg7kd9r39i9phkg7jjzgb5sms9c-rustc-1.26.2-man
    copying path '/nix/store/iilh77wdmhrb01rb7l8gpqsrpcsrll9q-rustc-1.26.2-doc' from 'https://cache.nixos.org'...
    copying path '/nix/store/rndszwg7kd9r39i9phkg7jjzgb5sms9c-rustc-1.26.2-man' from 'https://cache.nixos.org'...
    copying path '/nix/store/m9lapiddi7k74q3wqhk4hs1mg64g64pw-rustc-1.26.2' from 'https://cache.nixos.org'...
    building '/nix/store/anax7p8k96qw2j5fhzax9za557zky2kc-user-environment.drv'...
    created 116 symlinks in user environment

Пакет установлен, если требуются зависимости, они так же будут подтянуты и установлены. После чего программа готова к использованию.

На деле тут еще много можно описывать про тонкости работы с Nix. За подробностями отсылаю к официальной документации: [Nix manual](https://nixos.org/nix/manual/ "Nix manual").
