---
title: "Simple go version manager"
date: 2022-03-20T10:52:15+0300
image: https://static.juev.org/2022/03/golang.png
tags: 
  - golang
  - tips
---

На протяжении долгого времени устанавливал golang с помощью homebrew:

```bash
brew install golang
```

Проблема заключается в том, что после выхода очередного обновления новая версия появляется в brew далеко не сразу. И использовать в работе новую версию удастся лишь спустя неделю минимум, если конечного не ставить вручную. Плюс нет возможности для определенных проектов фиксировать используемую версию golang, версия ставиться глобально на всю систему.

Проблема легко решается с помощью утилиты `g`: [stefanmaric/g](https://github.com/stefanmaric/g)

Перед установкой нужно удалить версию golang, установленную с помощью homebrew, и определить переменные `GOROOT` и `GOPATH`:

```bash
brew remove golang
export GOROOT=~/go
export GOPATH=~/.go
curl -sSL https://git.io/g-install | sh -s
```

Переменные нужно будет добавить в системную конфигурацию, не забыв добавить в `PATH` директорию `~/go/bin`. Все управление описано в хелпе приложения:

```bash
Usage: g [COMMAND] [options] [args]

  Commands:

    g                         Open interactive UI with downloaded versions
    g install latest          Download and set the latest go release
    g install <version>       Download and set go <version>
    g download <version>      Download go <version>
    g set <version>           Switch to go <version>
    g run <version>           Run a given version of go
    g which <version>         Output bin path for <version>
    g remove <version ...>    Remove the given version(s)
    g prune                   Remove all versions except the current version
    g list                    Output downloaded go versions
    g list-all                Output all available, remote go versions
    g self-upgrade            Upgrades g to the latest version
    g help                    Display help information, same as g --help

  Options:

    -h, --help                Display help information and exit
    -v, --version             Output current version of g and exit
    -q, --quiet               Suppress almost all output
    -c, --no-color            Force disabled color output
    -y, --non-interactive     Prevent prompts
    -o, --os                  Override operating system
    -a, --arch                Override system architecture
    -u, --unstable            Include unstable versions in list
```

После установки утилиты проводим установку версий golang и свободно переключаемся между ними:

```bash
❯ g install latest

      selected: 1.18
      location: /Users/user/.go/.versions/1.18
   downloading: https://dl.google.com/go/go1.18.darwin-arm64.tar.gz
    downloaded: 1.18
     installed: go version go1.18 darwin/arm64

❯ go version
go version go1.18 darwin/arm64

❯ g install 1.17.8

      selected: 1.17.8
      location: /Users/user/.go/.versions/1.17.8
   downloading: https://dl.google.com/go/go1.17.8.darwin-arm64.tar.gz
    downloaded: 1.17.8
     installed: go version go1.17.8 darwin/arm64

❯ go version
go version go1.17.8 darwin/arm64

❯ g list

  > 1.17.8
    1.18

❯ g set 1.18

❯ go version
go version go1.18 darwin/arm64

❯ g prune
        remove: 1.17.8
```

Теперь в системе оказываются несколько версий golang, между которыми очень легко переключаться. 

