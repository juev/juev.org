---
layout: post
title: Git autocomlete for bash
keywords: bash, git, autocomlete, tips
gplus: https://plus.google.com/116661482374124481456/posts/CLxVrpMHDFZ
date: 2011-11-25 13:16
tags:
- bash
- git
- tips
---
Когда много работаешь в bash привыкаешь к автодополнению команд по **Tab**. И очень мешает работать отсутствие автокомплита в некоторых командах.

К примеру, при использовании Git набираешь `git aut`, жмешь **Tab**, а ничего не происходит.  Начинает просто бесить...

Решение довольно простое, делаем раз:

    curl "https://raw.github.com/git/git/master/contrib/completion/git-completion.bash" -o ~/.git-completion.bash

либо используем wget:

    wget "https://raw.github.com/git/git/master/contrib/completion/git-completion.bash" -O ~/.git-completion.bash

После чего делаем два, то есть добавляем следующую строку к файлу `~/.bashrc` или в macos это файл `~/.profile`:

    source ~/.git-completion.bash

Теперь для того, чтобы изменения сразу же применились, можно эту же команду дать в терминале.
