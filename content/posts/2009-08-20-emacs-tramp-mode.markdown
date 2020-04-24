---
title: "Emacs Tramp-mode"
date: "2009-08-20T00:00:00+0400"
tags:
  - emacs
keywords: emacs,trampmode,tramp
---
Комментарий от читателя **Whitesquall** (19 августа 2011г.):

*Для решения проблемы работы zsh с tramp-режимом есть и более изящное решение.
Необходимо добавить в конфиг zsh следующие строчки:*

```zsh
if [[ "$TERM" == "dumb" ]]
then
unsetopt zle
unsetopt prompt_cr
unsetopt prompt_subst
unfunction precmd
unfunction preexec
PS1='$ '
fi
```

*Это позволит не менять шелл на bash в емаксе, но и решит проблемы с tramp, если Вы
захотите редактировать файл на удалённой машине, где по умолчанию также стоит zsh.*

Удачного Emacs-хакинга!
