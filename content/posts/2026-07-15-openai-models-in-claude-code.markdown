---
title: "OpenAI-модели в Claude Code через CLIProxyAPI"
date: 2026-07-15T22:33:00+0300
tags:
  - claude-code
  - openai
  - cliproxyapi
  - llm
  - macos
---

Claude Code даёт готовый coding agent с доступом к файлам и терминалу, Plan Mode, subagents, hooks, skills, MCP и системой permissions. Клиент читает инструкции проекта из `CLAUDE.md`, поэтому накопленные правила не приходится переносить в новый формат.

CLIProxyAPI[^1] позволяет оставить этот интерфейс и отправлять запросы в модели OpenAI. Claude Code обращается к локальному Anthropic-совместимому endpoint, прокси переводит запрос в протокол провайдера и возвращает ответ в понятном клиенту формате.

Я проверял настройку 15 июля 2026 года на macOS с CLIProxyAPI 7.2.75 и Claude Code 2.1.210. В списке моделей были `gpt-5.6-sol`, `gpt-5.6-terra` и `gpt-5.6-luna`. Имена моделей и доступность через OAuth меняются, поэтому перед настройкой стоит запросить `/v1/models` у своего экземпляра прокси.

## Что остаётся от Claude Code

При такой схеме Claude Code продолжает управлять рабочим процессом:

- находит файлы и передаёт модели нужный контекст;
- запускает команды, тесты и другие tools;
- применяет permissions, hooks, skills, MCP и настройки из `.claude/`;
- загружает `CLAUDE.md`, `CLAUDE.local.md` и `.claude/rules/`.

Модель OpenAI получает уже собранный prompt и описания tools. CLIProxyAPI отвечает за аутентификацию, преобразование форматов и выбор upstream:

```text
Claude Code
    │ Anthropic Messages API
    ▼
CLIProxyAPI на 127.0.0.1:8317
    │ перевод запроса и ответа
    ├── OpenAI Codex OAuth
    ├── Anthropic OAuth или API key
    ├── Gemini API
    └── OpenAI-совместимый provider, например OpenRouter
```

`CLAUDE.md` обрабатывает сам клиент, поэтому смена модели не отключает инструкции проекта. Claude Code загружает файлы от корня файловой системы до текущего каталога, а вложенные инструкции добавляет, когда читает файлы в соответствующем подкаталоге[^2]. Команда `/memory` показывает, какие инструкции попали в текущую сессию.

`CLAUDE.md` попадает в контекст как сообщение пользователя, поэтому модель может нарушить инструкции. Для запретов и обязательных действий Anthropic рекомендует permissions и hooks[^2]. Качество соблюдения правил также зависит от выбранной модели.

## Зачем сочетать Claude Code и OpenAI

Такая схема упрощает миграцию. Если проект уже хранит команды сборки, архитектурные решения и правила review в `CLAUDE.md`, они продолжат работать. Не нужно заводить второй набор инструкций ради другой модели.

Ещё один плюс даёт выбор модели под задачу. В Claude Code есть логические уровни `opus`, `sonnet` и `haiku`. Их можно сопоставить с тремя моделями OpenAI: дорогой для планирования, средней для основной работы и быстрой для фоновых операций. Режим `opusplan` использует `opus` в Plan Mode и переключается на `sonnet` при реализации[^3].

CLIProxyAPI также даёт единую точку настройки. Он хранит несколько учётных записей, подключает API keys, назначает моделям aliases и направляет запросы по префиксу. Клиент остаётся прежним, даже если upstream меняется.

## Установка на macOS

Claude Code и CLIProxyAPI доступны в Homebrew:

```bash
brew install --cask claude-code
brew install cliproxyapi
```

Anthropic предлагает и native installer, который обновляет Claude Code автоматически. Homebrew-версию нужно обновлять командой `brew upgrade claude-code`[^4]. CLIProxyAPI устанавливает конфигурацию в:

```bash
echo "$(brew --prefix)/etc/cliproxyapi.conf"
```

На Apple Silicon это обычно `/opt/homebrew/etc/cliproxyapi.conf`; на Intel Mac используется `/usr/local/etc/cliproxyapi.conf`[^5].

Сначала создадим локальный token, которым Claude Code будет авторизоваться в прокси:

```bash
openssl rand -hex 32
```

Скопируйте результат и откройте конфигурацию:

```bash
nano "$(brew --prefix)/etc/cliproxyapi.conf"
```

Для локального запуска достаточно следующего файла:

```yaml
host: "127.0.0.1"
port: 8317
auth-dir: "~/.cli-proxy-api"

api-keys:
  - "ВСТАВЬТЕ_СЮДА_СЛУЧАЙНЫЙ_TOKEN"

routing:
  strategy: "fill-first"
  session-affinity: true
  session-affinity-ttl: "1h"

request-retry: 3
max-retry-interval: 30

remote-management:
  allow-remote: false
  secret-key: ""
  disable-control-panel: true
```

Параметр `host: "127.0.0.1"` закрывает порт от других машин. Значение по умолчанию пустое и заставляет CLIProxyAPI слушать все IPv4- и IPv6-интерфейсы[^6]. Для локального coding agent это лишний риск.

## Вход в OpenAI

CLIProxyAPI получает доступ к моделям OpenAI через Codex OAuth:

```bash
cliproxyapi -codex-login
```

Команда откроет браузер и сохранит OAuth credentials в `auth-dir`. Если браузер нужно открыть на другой машине, добавьте `--no-browser`. Для локального callback Codex CLIProxyAPI по умолчанию открывает port 1455[^7]. Доступные модели и quotas зависят от учётной записи OpenAI.

После входа запустите сервис:

```bash
brew services start cliproxyapi
```

Проверим service и список доступных моделей двумя командами:

```bash
brew services list | grep cliproxyapi

curl -sS \
  -H "Authorization: Bearer ВАШ_ЛОКАЛЬНЫЙ_TOKEN" \
  http://127.0.0.1:8317/v1/models
```

Первая команда подтверждает работу процесса, вторая показывает модели, доступные именно вашей учётной записи. Если модель отсутствует в этом ответе, не добавляйте её в Claude Code по примеру из статьи.

## Настройка Claude Code

Claude Code можно настроить через переменные окружения или `~/.claude/settings.json`. Второй вариант действует и в CLI, и в расширении VS Code[^8]. Откройте файл:

```bash
nano ~/.claude/settings.json
```

Добавьте локальный endpoint и сопоставление моделей:

```json
{
  "model": "opusplan",
  "env": {
    "ANTHROPIC_BASE_URL": "http://127.0.0.1:8317",
    "ANTHROPIC_AUTH_TOKEN": "ВСТАВЬТЕ_ТОТ_ЖЕ_ЛОКАЛЬНЫЙ_TOKEN",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "gpt-5.6-sol(xhigh)",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "gpt-5.6-terra(high)",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "gpt-5.6-luna(low)"
  }
}
```

OpenAI описывает `sol` как модель с максимальными возможностями, `terra` как более экономичный вариант, а `luna` как модель для быстрых массовых запросов[^9]. Это даёт понятное соответствие уровням Claude Code:

| Alias Claude Code | Модель OpenAI | Задачи |
|---|---|---|
| `opus` | `gpt-5.6-sol(xhigh)` | Plan Mode, сложный анализ и review |
| `sonnet` | `gpt-5.6-terra(high)` | реализация и обычная работа с кодом |
| `haiku` | `gpt-5.6-luna(low)` | быстрые и фоновые запросы |

Суффиксы в скобках обрабатывает CLIProxyAPI. Для OpenAI и Codex прокси удаляет суффикс из имени модели и записывает уровень в `reasoning.effort`. Поддерживаются `minimal`, `low`, `medium`, `high`, `xhigh`, `auto` и `none`[^10]. Если provider отвергает уровень, запрос вернёт HTTP 400. Начните с `high`, а `xhigh` оставьте для задач, где дополнительное время и расход tokens дают заметный результат.

Запустите Claude Code из проекта:

```bash
cd ~/src/my-project
claude
```

Команда `/model` покажет логические модели Claude Code. При конфигурации выше `opus`, `sonnet` и `haiku` отправятся в разные модели OpenAI. `/model opusplan` закрепляет разделение: `sol` для плана, `terra` для реализации.

Для разовой проверки можно не менять `settings.json`:

```bash
ANTHROPIC_BASE_URL=http://127.0.0.1:8317 \
ANTHROPIC_AUTH_TOKEN=ВАШ_ЛОКАЛЬНЫЙ_TOKEN \
ANTHROPIC_MODEL='gpt-5.6-sol(high)' \
claude
```

## Несколько провайдеров и явный роутинг

CLIProxyAPI выбирает upstream по имени модели. Для OpenAI-совместимых сервисов можно задать prefix, который исключает неоднозначность. Например, добавим OpenRouter в `cliproxyapi.conf`:

```yaml
openai-compatibility:
  - name: "openrouter"
    prefix: "openrouter"
    base-url: "https://openrouter.ai/api/v1"
    api-key-entries:
      - api-key: "sk-or-v1-..."
    models:
      - name: "moonshotai/kimi-k2:free"
        alias: "kimi-k2"
```

Теперь имя `openrouter/kimi-k2` направляет запрос в OpenRouter. Документация CLIProxyAPI использует тот же upstream и alias в примере конфигурации[^11]. Перед назначением сторонней модели уровню `haiku` проверьте поддержку tools: Claude Code зависит от корректного function calling.

Можно направить разные уровни Claude Code в разные провайдеры:

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "http://127.0.0.1:8317",
    "ANTHROPIC_AUTH_TOKEN": "ВАШ_ЛОКАЛЬНЫЙ_TOKEN",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "gpt-5.6-sol(xhigh)",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "gpt-5.6-terra(high)",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "openrouter/kimi-k2"
  }
}
```

CLIProxyAPI отслеживает изменения `cliproxyapi.conf` и `auth-dir` и применяет большинство из них без перезапуска[^12]. После правки повторите запрос к `/v1/models`, чтобы обнаружить опечатку в alias или недоступный провайдер.

### Несколько credentials одного провайдера

Параметр `routing.strategy` выбирает credential, когда одной модели соответствуют несколько учётных записей:

- `round-robin` чередует доступные credentials;
- `fill-first` использует первую до исчерпания quota, затем переходит к следующей.

`session-affinity: true` сохраняет выбранную credential для сессии. CLIProxyAPI извлекает session ID из поля `metadata.user_id`, которое передаёт Claude Code. При недоступности credential прокси выполняет failover, а `session-affinity-ttl` задаёт срок привязки[^6].

Для явного разделения маршрутов используйте `prefix` и включите `force-model-prefix: true`. Если для учётной записи обязателен `prefix`, прокси не направит через неё запрос без префикса. Поля `excluded-models` позволяют закрыть отдельные модели или wildcard-группы для конкретного provider.

## Возможные проблемы

### Протоколы совпадают не полностью

Claude Code отправляет Anthropic Messages API, а CLIProxyAPI переводит его в OpenAI Responses или другой upstream-протокол. Streaming и tools поддерживаются, но сложные tool calls, extended thinking, prompt caching и подсчёт tokens могут вести себя иначе. После обновления клиента, прокси или модели полезно прогнать один и тот же небольшой coding task и проверить diff.

Функции OpenAI, которых нет в протоколе Claude Code, клиент не сможет использовать напрямую. Например, выбор модели через Claude Code не превращает его в Codex CLI и не добавляет элементы Responses API, для которых у Claude Code нет интерфейса.

### System prompt рассчитан на Claude

Claude Code формирует prompt и tool schemas под модели Claude. GPT обычно справляется с ними, но может иначе планировать работу, чаще запрашивать подтверждение или хуже соблюдать часть инструкций. Модель реже отклоняется от коротких проверяемых правил в `CLAUDE.md`.

### Дополнительная точка отказа

Рабочая цепочка теперь зависит от Claude Code, локального процесса CLIProxyAPI и upstream provider. Сессия прервётся, если прокси ошибётся при переводе протокола или получит устаревший model ID. Версии клиента и прокси лучше обновлять вместе и проверять через короткий smoke test.

### OAuth и API могут измениться

CLIProxyAPI развивает сторонняя команда. Anthropic и OpenAI не заявляют официальную поддержку связки Claude Code с Codex OAuth. Provider может изменить OAuth flow, quotas или допустимые способы использования. Перед рабочим применением проверьте условия своей подписки и не стройте критичный CI только на интерактивном OAuth.

### Secrets хранятся локально

OAuth credentials лежат в `~/.cli-proxy-api`, API ключи могут находиться в `cliproxyapi.conf`, а локальный токен записан в `~/.claude/settings.json`. Ограничьте права на файлы:

```bash
chmod 700 ~/.cli-proxy-api ~/.claude
chmod 600 "$(brew --prefix)/etc/cliproxyapi.conf" ~/.claude/settings.json
```

Не коммитьте эти файлы. Если прокси нужен на нескольких компьютерах, настройте TLS, firewall и отдельные client tokens. Недостаточно открыть port 8317 в локальной сети.

### Часть корпоративных функций отключается

Claude Code считает нестандартный `ANTHROPIC_BASE_URL` сторонним provider. Server-managed настройки Anthropic при такой схеме недоступны[^13]. Локальные и проектные настройки, permissions и hooks продолжают работать, но централизованные политики нужно развернуть другим способом.

## Диагностика

Проверять цепочку удобнее по уровням.

Сначала убедитесь, что сервис запущен:

```bash
brew services list | grep cliproxyapi
lsof -nP -iTCP:8317 -sTCP:LISTEN
```

Затем запросите модели с тем же token, который указан в Claude Code:

```bash
curl -sS \
  -H "Authorization: Bearer ВАШ_ЛОКАЛЬНЫЙ_TOKEN" \
  http://127.0.0.1:8317/v1/models
```

Если endpoint отвечает, запустите `claude` и выполните `/doctor`. Команда `/memory` подтвердит загрузку `CLAUDE.md`, а `/model` покажет выбранный alias.

Ошибки самого прокси удобнее смотреть при foreground-запуске. Остановите service, запустите тот же binary с явным config path, а после диагностики снова запустите service:

```bash
brew services stop cliproxyapi
cliproxyapi -config "$(brew --prefix)/etc/cliproxyapi.conf"

# После Ctrl+C
brew services start cliproxyapi
```

После смены провайдеров начните новую сессию. Так старый context и prompt cache не будут влиять на сравнение.

## Итоговая конфигурация

Для локальной работы я бы начал с Codex OAuth и трёх OpenAI-моделей:

- `gpt-5.6-sol(xhigh)` для планирования и сложного review;
- `gpt-5.6-terra(high)` для реализации;
- `gpt-5.6-luna(low)` для быстрых операций.

Claude Code продолжает использовать tools coding agent и инструкции проекта из `CLAUDE.md`. Через CLIProxyAPI можно менять provider, не переписывая workflow. При этом вам придётся поддерживать дополнительный процесс, проверять преобразование протоколов и тестировать совместимость после обновлений.

## Источники

[^1]: [Что такое CLIProxyAPI](https://help.router-for.me/introduction/what-is-cliproxyapi)

[^2]: [Claude Code: CLAUDE.md и memory](https://code.claude.com/docs/en/memory)

[^3]: [Claude Code: настройка моделей](https://code.claude.com/docs/en/model-config)

[^4]: [Claude Code: установка](https://code.claude.com/docs/en/setup)

[^5]: [CLIProxyAPI: Quick Start](https://help.router-for.me/introduction/quick-start)

[^6]: [CLIProxyAPI: параметры конфигурации](https://help.router-for.me/configuration/options)

[^7]: [CLIProxyAPI: OpenAI Codex через OAuth](https://help.router-for.me/configuration/provider/codex)

[^8]: [Claude Code: сторонние providers и LLM gateways](https://code.claude.com/docs/en/third-party-integrations)

[^9]: [OpenAI: выбор модели GPT-5.6](https://developers.openai.com/api/docs/guides/latest-model)

[^10]: [CLIProxyAPI: Thinking Budgets](https://help.router-for.me/configuration/thinking)

[^11]: [CLIProxyAPI: OpenAI-совместимые providers](https://help.router-for.me/configuration/provider/openai-compatibility)

[^12]: [CLIProxyAPI: hot reload](https://help.router-for.me/configuration/hot-reloading)

[^13]: [Claude Code: server-managed settings](https://code.claude.com/docs/en/server-managed-settings)
