---
title: "Статистика atuin"
date: 2024-12-31T10:52:02+0300
tags: 
  - cli
  - console
---

Для хранения и синхронизации истории команд в терминале использую [atuin](https://atuin.sh/).

Перед новым годом была выпущена версия, в которой добавили новую команду `atuin wrapped`,
отображающую статистику по использованию команд, вот что получилось у меня:

```plain
╭────────────────────────────────────╮
│        ATUIN WRAPPED 2024          │
│    Your Year in Shell History      │
╰────────────────────────────────────╯

🎉 In 2024, you typed 9778 commands!
   That's ~26 commands every day

Your Top Commands:
[▮▮▮▮▮▮▮▮▮▮] 1464 ssh
[▮▮▮▮▮     ]  742 brew
[▮▮▮       ]  444 crane
[▮▮        ]  409 curl
[▮▮        ]  398 go run
[▮▮        ]  359 docker compose
[▮▮        ]  310 vim
[▮         ]  269 chezmoi
[▮         ]  186 hbs
[▮         ]  153 go mod
Total commands:   9778
Unique commands:  3509

📚 Command Vocabulary: You know 3509 unique commands

📦 Package Management: You ran 960 package-related commands

🚨 Error Analysis: Your commands failed 31.2% of the time

🔍 Command Evolution:
  Top Commands in the first half of 2024:
    ssh (518 times)
    docker (425 times)
    brew (302 times)
  Top Commands in the second half of 2024:
    ssh (946 times)
    go (706 times)
    git (504 times)
  New favorites in the second half:
    go (706 times)
    crane (444 times)

🕘 Most Productive Hour: 12:00 (1300 commands)
```

Стоит только указать, что vim является алиасом на neovim. А hbs это просмотр статистики hledger.

Удивительно, что более 30% команд приводили к ошибкам. Надо будет обратить внимание на этот момент.
