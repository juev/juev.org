---
title: "Git autocomlete for bash"
date: "2011-11-25T13:16:00+0400"
tags:
  - bash
  - git
  - tips
keywords: bash, git, autocomlete, tips
---
Когда много работаешь в bash привыкаешь к автодополнению команд по **Tab**. И очень мешает работать отсутствие автокомплита в некоторых командах.

К примеру, при использовании Git набираешь `git aut`, жмешь **Tab**, а ничего не происходит.  Начинает просто бесить...

Решение довольно простое, делаем раз:

```bash
curl "https://raw.github.com/git/git/master/contrib/completion/git-completion.bash" -o ~/.git-completion.bash
```

либо используем wget:

```bash
wget "https://raw.github.com/git/git/master/contrib/completion/git-completion.bash" -O ~/.git-completion.bash
```

После чего делаем два, то есть добавляем следующую строку к файлу `~/.bashrc` или в macos это файл `~/.profile`:

```bash
source ~/.git-completion.bash
```

Теперь для того, чтобы изменения сразу же применились, можно эту же команду дать в терминале.
