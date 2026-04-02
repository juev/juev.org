---
title: "Заметки под контролем: развёртывание Standard Notes с E2E-шифрованием"
date: 2026-04-02T16:22:00+0300
tags:
  - self-hosted
  - podman
  - obsidian
  - notes
---

Заметки — неотъемлемая часть моей работы и жизни. Записываю идеи, технические
решения, рецепты, документы, планы. За годы я перепробовал разные подходы и в
итоге развернул собственный сервер Standard Notes. Рассказываю, как и почему.

## Зачем вести заметки

Голова не предназначена для хранения информации — она нужна для мышления.
Заметки освобождают оперативную память: записал — забыл — нашёл когда нужно.
Без системы заметок информация теряется, задачи забываются, а хорошие идеи
растворяются в потоке дней.

## Существующие решения

### Apple Notes

Встроенное приложение, доступно на всех устройствах Apple.

**Плюсы:**

- Нулевой порог входа — уже установлено
- Синхронизация через iCloud
- Хороший rich-text редактор
- Сканирование документов на iPhone

**Минусы:**

- Привязка к экосистеме Apple — нет нормального доступа с Android или Linux
- Данные в iCloud — нет контроля над хранением
- Нет тегов (только папки), слабый поиск
- Невозможно экспортировать заметки в удобном формате без дополнительных
  инструментов
- Нет шифрования на стороне клиента

### Obsidian

Редактор на основе markdown-файлов, хранящихся локально.

**Плюсы:**

- Файлы в plain text (markdown) — переносимость и долговечность
- Мощная система ссылок между заметками
- Огромная экосистема плагинов
- Работает без интернета
- Данные полностью под контролем

**Минусы:**

- Само приложение [проприетарное](https://obsidian.md/license) — файлы открытые, но редактор нет
- Синхронизация — отдельная проблема (Obsidian Sync платный, iCloud ненадёжен
  для vault'ов, Syncthing требует настройки)
- На мобильных устройствах работает посредственно
- Wikilinks и плагины создают vendor lock-in — заметки формально markdown,
  но с Obsidian-специфичным синтаксисом
- Нет веб-доступа

### Joplin

Open-source заметочник с опциональным E2E-шифрованием и синхронизацией через
Joplin Cloud, Nextcloud, WebDAV или S3.

**Плюсы:**

- Полностью open-source — и клиенты, и [сервер](https://github.com/laurent22/joplin)
- E2E-шифрование
- Markdown-заметки
- Множество бэкендов для синхронизации
- Веб-clipper для сохранения страниц

**Минусы:**

- E2E-шифрование нужно включать вручную — по умолчанию выключено
- Интерфейс заметно уступает конкурентам
- Мобильные приложения слабее десктопных
- Нет полноценного веб-доступа — Joplin Cloud предоставляет базовый просмотр,
  но не полноценный редактор

## Почему самохостинг и Standard Notes

Хотелось решение, которое:

- Работает на всех платформах (iOS, macOS, Linux, веб)
- Синхронизирует заметки между устройствами
- Шифрует данные end-to-end (сервер не видит содержимое)
- Позволяет хранить данные на своём сервере
- Имеет нормальные мобильные приложения

Standard Notes подошёл по всем пунктам. Ключевое отличие от конкурентов —
**end-to-end шифрование по умолчанию**. Сервер хранит зашифрованные blob'ы,
ключи только на клиенте. Даже при компрометации сервера заметки остаются
защищены.

В отличие от Joplin, где E2E-шифрование — опция, которую нужно включить
и настроить, в Standard Notes это базовый принцип архитектуры: шифрование
нельзя случайно отключить или забыть включить.

### Про подписку

Standard Notes использует freemium-модель. Бесплатная версия существенно
ограничена: только plain text редактор, нет вложенных тегов, нет загрузки файлов.
Для полноценной работы нужна подписка Professional.

Проект с открытым исходным кодом — [standardnotes/server](https://github.com/standardnotes/server)
на GitHub. Там же можно найти актуальный `docker-compose.yml` и issues.

При самохостинге подписку можно активировать напрямую через базу данных —
подробности ниже. Но для мобильных приложений потребуется **Offline Activation
Code** — без него приложения работают в бесплатном режиме даже при наличии
подписки на сервере.

## Развёртывание

### Требования к серверу

Standard Notes — не самое лёгкое приложение. Архитектура включает 5 контейнеров:

| Контейнер | Назначение | Образ |
|-----------|-----------|-------|
| standardnotes | API-сервер (sync, auth, files) | `standardnotes/server` |
| standardnotes-web | Веб-интерфейс (nginx + SPA) | `standardnotes/web` |
| standardnotes-db | MySQL 8 | `mysql:8` |
| standardnotes-cache | Redis | `redis:6.0-alpine` |
| standardnotes-localstack | Очередь сообщений (SNS/SQS) | `localstack/localstack:3.0` |

LocalStack эмулирует AWS SNS/SQS для асинхронного обмена сообщениями между
микросервисами внутри API-сервера. Да, для заметочника нужна очередь сообщений.

**Минимальные требования:** 2 ГБ RAM, 2 CPU.

### Podman Quadlet

Использую rootless Podman с Quadlet-файлами (systemd-интеграция). Все контейнеры
запускаются как пользовательские сервисы.

Структура файлов:

```text
~/.config/containers/systemd/standardnotes/
├── standardnotes.container
├── standardnotes.env
├── standardnotes-web.container
├── standardnotes-db.container
├── standardnotes-cache.container
├── standardnotes-localstack.container
├── standardnotes_db.network
└── localstack_bootstrap.sh

~/.config/containers/systemd/configs/standardnotes/
└── nginx.conf
```

Ниже — содержимое каждого файла. Замените `notes.example.org` на свой домен.

#### Внутренняя сеть (standardnotes_db.network)

```ini
[Network]
NetworkName=standardnotes_db
```

Изолированная сеть для связи между API-сервером, MySQL, Redis и LocalStack.
Внешний трафик сюда не попадает.

#### База данных MySQL (standardnotes-db.container)

```ini
[Unit]
Description=MySQL for Standard Notes

[Container]
ContainerName=standardnotes-db
Image=docker.io/library/mysql:8
Volume=%h/volumes/standardnotes/mysql:/var/lib/mysql:Z
Environment=MYSQL_DATABASE=standard_notes_db
Environment=MYSQL_USER=std_notes_user
Environment=MYSQL_ROOT_PASSWORD=<your-db-password>
Environment=MYSQL_PASSWORD=<your-db-password>
Network=standardnotes_db.network
HealthCmd=mysqladmin ping -h localhost
HealthInterval=10s
HealthStartPeriod=30s
AutoUpdate=registry

[Service]
Restart=always

[Install]
WantedBy=default.target
```

#### Redis (standardnotes-cache.container)

```ini
[Unit]
Description=Redis for Standard Notes

[Container]
ContainerName=standardnotes-cache
Image=docker.io/library/redis:6.0-alpine
Volume=%h/volumes/standardnotes/redis:/data:Z
Network=standardnotes_db.network
HealthCmd=redis-cli ping
HealthInterval=10s
HealthStartPeriod=10s
AutoUpdate=registry

[Service]
Restart=always

[Install]
WantedBy=default.target
```

#### LocalStack (standardnotes-localstack.container)

```ini
[Unit]
Description=LocalStack (SNS/SQS) for Standard Notes
After=network-online.target

[Container]
ContainerName=standardnotes-localstack
Image=docker.io/localstack/localstack:3.0
Environment=SERVICES=sns,sqs
Environment=HOSTNAME_EXTERNAL=standardnotes-localstack
Environment=LS_LOG=warn
Volume=%h/.config/containers/systemd/standardnotes/localstack_bootstrap.sh:/etc/localstack/init/ready.d/localstack_bootstrap.sh:ro,Z
Network=standardnotes_db.network

[Service]
Restart=always

[Install]
WantedBy=default.target
```

LocalStack при старте выполняет bootstrap-скрипт, который создаёт топики и
очереди для внутренней коммуникации Standard Notes.

#### LocalStack bootstrap (localstack_bootstrap.sh)

В официальном `docker-compose.yml` Standard Notes команды создания топиков и
очередей прописаны inline в `entrypoint`. В Podman Quadlet нет аналога
многострочного entrypoint, поэтому эти команды вынесены в отдельный скрипт.
Он монтируется в контейнер и запускается автоматически при старте.
Не забудьте сделать скрипт исполняемым: `chmod +x localstack_bootstrap.sh`.

```bash
#!/usr/bin/env bash
set -euo pipefail

LOCALSTACK_HOST=localhost
AWS_REGION=us-east-1
LOCALSTACK_DUMMY_ID=000000000000

create_queue() {
  awslocal --endpoint-url=http://${LOCALSTACK_HOST}:4566 sqs create-queue --queue-name "$1"
}

create_topic() {
  awslocal --endpoint-url=http://${LOCALSTACK_HOST}:4566 sns create-topic --name "$1"
}

link_queue_and_topic() {
  awslocal --endpoint-url=http://${LOCALSTACK_HOST}:4566 sns subscribe \
    --topic-arn "$1" --protocol sqs --notification-endpoint "$2"
}

arn() { echo "arn:aws:sns:${AWS_REGION}:${LOCALSTACK_DUMMY_ID}:$1"; }

# 7 топиков
for T in payments-local-topic syncing-server-local-topic auth-local-topic \
         files-local-topic analytics-local-topic revisions-server-local-topic \
         scheduler-local-topic; do
  create_topic "$T"
done

# 6 очередей
for Q in analytics-local-queue auth-local-queue files-local-queue \
         syncing-server-local-queue revisions-server-local-queue \
         scheduler-local-queue; do
  create_queue "$Q"
done

# Связи между топиками и очередями
link_queue_and_topic "$(arn payments-local-topic)" "$(arn analytics-local-queue)"
link_queue_and_topic "$(arn payments-local-topic)" "$(arn auth-local-queue)"
link_queue_and_topic "$(arn auth-local-topic)" "$(arn auth-local-queue)"
link_queue_and_topic "$(arn files-local-topic)" "$(arn auth-local-queue)"
link_queue_and_topic "$(arn revisions-server-local-topic)" "$(arn auth-local-queue)"
link_queue_and_topic "$(arn syncing-server-local-topic)" "$(arn auth-local-queue)"
link_queue_and_topic "$(arn auth-local-topic)" "$(arn files-local-queue)"
link_queue_and_topic "$(arn syncing-server-local-topic)" "$(arn files-local-queue)"
link_queue_and_topic "$(arn syncing-server-local-topic)" "$(arn syncing-server-local-queue)"
link_queue_and_topic "$(arn files-local-topic)" "$(arn syncing-server-local-queue)"
link_queue_and_topic "$(arn auth-local-topic)" "$(arn syncing-server-local-queue)"
link_queue_and_topic "$(arn syncing-server-local-topic)" "$(arn revisions-server-local-queue)"
link_queue_and_topic "$(arn revisions-server-local-topic)" "$(arn revisions-server-local-queue)"
```

#### API-сервер (standardnotes.container)

```ini
[Unit]
Description=Standard Notes Server
After=standardnotes-db.service standardnotes-cache.service standardnotes-localstack.service
Requires=standardnotes-db.service standardnotes-cache.service standardnotes-localstack.service

[Container]
ContainerName=standardnotes
Image=docker.io/standardnotes/server
EnvironmentFile=%h/.config/containers/systemd/standardnotes/standardnotes.env
Volume=%h/volumes/standardnotes/logs:/var/lib/server/logs:Z
Volume=%h/volumes/standardnotes/uploads:/opt/server/packages/files/dist/uploads:Z
Network=standardnotes_db.network
Network=caddy.network
HealthCmd=curl -fsS http://127.0.0.1:3000/healthcheck || exit 1
HealthInterval=30s
AutoUpdate=registry

[Service]
Restart=always

[Install]
WantedBy=default.target
```

Сервер подключён к двум сетям: `standardnotes_db.network` (внутренняя, для
MySQL/Redis/LocalStack) и `caddy.network` (для доступа через reverse proxy).

#### Переменные окружения (standardnotes.env)

```bash
## БД
DB_HOST=standardnotes-db
DB_PORT=3306
DB_USERNAME=std_notes_user
DB_PASSWORD=<your-db-password>
DB_DATABASE=standard_notes_db
DB_TYPE=mysql

## Redis
REDIS_PORT=6379
REDIS_HOST=standardnotes-cache
CACHE_TYPE=redis

## Ключи — сгенерируйте свои (openssl rand -hex 32)
AUTH_JWT_SECRET=<random-64-hex>
AUTH_SERVER_ENCRYPTION_SERVER_KEY=<random-64-hex>
VALET_TOKEN_SECRET=<random-64-hex>

## LocalStack (SNS/SQS)
SNS_TOPIC_ARN=arn:aws:sns:us-east-1:000000000000:syncing-server-local-topic
SNS_ENDPOINT=http://standardnotes-localstack:4566
SNS_DISABLE_SSL=true
SNS_SECRET_ACCESS_KEY=x
SNS_ACCESS_KEY_ID=x
SNS_AWS_REGION=us-east-1
SQS_QUEUE_URL=http://standardnotes-localstack:4566/000000000000/syncing-server-local-queue
SQS_AWS_REGION=us-east-1
SQS_ACCESS_KEY_ID=x
SQS_SECRET_ACCESS_KEY=x
SQS_ENDPOINT=http://standardnotes-localstack:4566

## Регистрация (см. «Активация PRO-подписки» — порядок действий)
DISABLE_USER_REGISTRATION=false

## Публичные URL (замените на свой домен)
FILES_SERVER_URL=https://files.notes.example.org

## CORS и cookies
CORS_ALLOWED_ORIGINS=https://notes.example.org
COOKIE_DOMAIN=.notes.example.org
COOKIE_SECURE=true

## Логирование
LOG_LEVEL=info
NODE_ENV=production
```

#### Веб-интерфейс (standardnotes-web.container)

```ini
[Unit]
Description=Standard Notes Web App
After=standardnotes.service

[Container]
ContainerName=standardnotes-web
Image=docker.io/standardnotes/web
Volume=%h/.config/containers/systemd/configs/standardnotes/nginx.conf:/etc/nginx/conf.d/default.conf:ro,Z
Network=caddy.network
AutoUpdate=registry

[Service]
Restart=always

[Install]
WantedBy=default.target
```

Зачем нужен кастомный nginx.conf — описано в разделе
«Веб-интерфейс: подводные камни».

### Доменная структура

Для Standard Notes нужно три домена:

- `notes.example.org` — веб-интерфейс
- `api.notes.example.org` — API/sync сервер
- `files.notes.example.org` — файловый сервер

Все три проксируются через reverse proxy (в моём случае — Caddy).
API и файловый сервер — один и тот же контейнер (`standardnotes:3000`),
но разделение на домены нужно для корректной работы CORS и cookies:

```caddyfile
notes.example.org {
    reverse_proxy standardnotes-web:80
}

api.notes.example.org {
    reverse_proxy standardnotes:3000
}

files.notes.example.org {
    reverse_proxy standardnotes:3000
}
```

### Запуск

После создания всех файлов:

```bash
# Создаём директории для данных
mkdir -p ~/volumes/standardnotes/{mysql,redis,logs,uploads}

# Перезагружаем Quadlet
export XDG_RUNTIME_DIR=/run/user/$(id -u)
systemctl --user daemon-reload

# Запускаем (зависимости подтянутся автоматически)
# Первый запуск MySQL займёт ~30 секунд на инициализацию БД
systemctl --user start standardnotes
systemctl --user start standardnotes-web
```

Убедиться, что всё поднялось:

```bash
systemctl --user status standardnotes standardnotes-db standardnotes-cache standardnotes-localstack standardnotes-web
```

### Активация PRO-подписки

Порядок действий:

1. Убедиться, что в env-файле `DISABLE_USER_REGISTRATION=false`
2. Зарегистрировать аккаунт через веб-интерфейс или приложение
3. Активировать PRO-подписку (SQL-запросы ниже)
4. Изменить на `DISABLE_USER_REGISTRATION=true` и перезапустить API-сервер

Подключаемся к MySQL:

```bash
podman exec -it standardnotes-db mysql -u std_notes_user -p standard_notes_db
```

Выполняем SQL-запросы:

```sql
-- 1. Находим UUID пользователя
SELECT uuid, email FROM users;
-- Результат: uuid = '4e54367a-...', email = 'you@example.org'

-- 2. Подставляем полученный uuid вместо <user-uuid> ниже

-- Создаём подписку на 10 лет
INSERT INTO user_subscriptions
  (uuid, plan_name, ends_at, created_at, updated_at,
   user_uuid, subscription_id, subscription_type)
VALUES
  (UUID(), 'PRO_PLAN',
   DATE_ADD(NOW(), INTERVAL 10 YEAR),
   NOW(), NOW(),
   '<user-uuid>', 1, 'regular');

-- Назначаем роль
INSERT INTO user_roles
  (uuid, role_uuid, user_uuid)
VALUES
  (UUID(),
   (SELECT uuid FROM roles WHERE name = 'PRO_USER'),
   '<user-uuid>');
```

Замените `<user-uuid>` в обоих запросах на значение `uuid` из первого SELECT.

После этого перезапускаем API-сервер:

```bash
systemctl --user restart standardnotes
```

### Offline Activation Code

PRO-подписка на сервере не активирует автоматически десктопные и мобильные
приложения — они проверяют подписку через свой механизм. Нужен
**Offline Activation Code**.

Получить его можно в веб-интерфейсе: **Preferences → General → Offline
Activation Code**. Код представляет собой длинную строку, которую нужно ввести
в каждом приложении.

**Проблема на мобильных:** на iOS ввод длинного кода неудобен, и само поле ввода
может работать нестабильно. Решение — активировать сначала на десктопе, а
мобильное приложение подхватит подписку через синхронизацию при следующем входе
в аккаунт.

## Веб-интерфейс: подводные камни

Развёртывание веб-интерфейса оказалось нетривиальным. Вот с чем я столкнулся.

### Hardcoded API URL

Веб-приложение Standard Notes (`standardnotes/web`) содержит **жёстко
прописанный** адрес `api.standardnotes.com` в собранных JavaScript-файлах.
При self-hosted установке приложение пытается подключиться к официальному
серверу, а не к вашему.

**Решение:** nginx с `sub_filter`, подменяющий URL на лету. Создайте файл
`configs/standardnotes/nginx.conf`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    sub_filter 'api.standardnotes.com' 'api.notes.example.org';
    sub_filter_once off;
    sub_filter_types text/html application/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

Этот конфиг монтируется в контейнер `standardnotes-web` (см. выше) и заменяет
стандартный nginx.conf.

### CORS и Cookie Domain

При разделении на поддомены (`notes` / `api.notes` / `files.notes`) возникают
проблемы с cross-origin запросами и cookies. В `standardnotes.env` необходимо:

1. `CORS_ALLOWED_ORIGINS=https://notes.example.org` — разрешить запросы
   с веб-интерфейса
2. `COOKIE_DOMAIN=.notes.example.org` — с точкой в начале, чтобы cookies
   работали на всех поддоменах
3. `COOKIE_SECURE=true` — обязательно для HTTPS

Без этих настроек аутентификация не работает — браузер не отправляет cookies
на cross-origin запросы.

## Импорт заметок из Obsidian

При переходе с Obsidian нужно перенести сотни заметок с сохранением структуры
директорий. Нативный импорт Standard Notes работает только с одной директорией
и не поддерживает автоматическое создание тегов.

### Скрипт конвертации

Написал Python-скрипт, который:

1. Рекурсивно обходит Obsidian vault
2. Извлекает теги из YAML frontmatter каждой заметки
3. Создаёт теги из имён директорий (lowercase)
4. Генерирует JSON в формате Standard Notes backup

Использование:

```bash
python3 obsidian-to-standardnotes.py \
  --vault ~/Documents/Obsidian \
  --output standard_notes_import.json \
  --ignore .git .obsidian Templates
```

Результат — один JSON-файл с заметками и тегами. Импорт через
**Preferences → Backups → Import Backup**.

Маппинг директорий в теги:

| Путь в Obsidian | Теги в Standard Notes |
|---|---|
| `Atlas/Notes/Деревья.md` | `atlas`, `notes` |
| `Efforts/Areas/Инфра/vpn.md` | `efforts`, `areas`, `инфра` |
| `Inbox/idea.md` | `inbox` |

<details>
<summary>Полный исходный код скрипта (obsidian-to-standardnotes.py)</summary>

```python
#!/usr/bin/env python3
"""
Obsidian Vault to Standard Notes Converter

Конвертирует Obsidian vault в JSON для импорта в Standard Notes.
Преобразует структуру папок в теги (lowercase).

Использование:
    python3 obsidian-to-standardnotes.py --vault /path/to/vault --output import.json
"""

import os
import json
import uuid
import argparse
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Set, Tuple


class ObsidianToStandardNotes:
    def __init__(self, vault_path: str):
        self.vault_path = Path(vault_path)
        self.items: List[Dict] = []
        self.tags_map: Dict[str, str] = {}
        self.note_tag_map: Dict[str, Set[str]] = {}

    def path_to_tags(self, filepath: Path) -> List[str]:
        """Возвращает отдельные теги из каждого компонента пути (lowercase)."""
        rel_path = filepath.relative_to(self.vault_path)
        parts = list(rel_path.parent.parts)
        return [p.lower() for p in parts]

    def extract_frontmatter_tags(self, content: str) -> List[str]:
        """Извлекает теги из YAML frontmatter Obsidian."""
        tags = []
        if not content.startswith('---'):
            return tags

        lines = content.split('\n')
        end_idx = None
        for i in range(1, len(lines)):
            if lines[i].strip() == '---':
                end_idx = i
                break

        if end_idx is None:
            return tags

        frontmatter = '\n'.join(lines[1:end_idx])

        # tags: [tag1, tag2]
        match = re.search(r'tags:\s*\[(.*?)\]', frontmatter, re.DOTALL)
        if match:
            return [t.strip() for t in match.group(1).split(',')]

        # tags:\n  - tag1\n  - tag2
        in_tags = False
        for line in frontmatter.split('\n'):
            if line.strip().startswith('tags:'):
                in_tags = True
                continue
            if in_tags:
                if line.startswith('  - '):
                    tags.append(line[4:].strip())
                elif line and not line.startswith(' '):
                    break

        return tags

    def remove_frontmatter(self, content: str) -> str:
        """Удаляет YAML frontmatter из содержимого файла."""
        if not content.startswith('---'):
            return content
        lines = content.split('\n')
        for i in range(1, len(lines)):
            if lines[i].strip() == '---':
                return '\n'.join(lines[i+1:]).strip()
        return content

    def create_note_item(self, filepath, title, content, tags):
        """Создает item для заметки в формате Standard Notes."""
        note_uuid = str(uuid.uuid4())
        note_item = {
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "uuid": note_uuid,
            "content_type": "Note",
            "content": {
                "title": title,
                "text": content,
                "noteType": "plain-text",
                "references": [
                    {"content_type": "Tag", "uuid": self.tags_map[tag]}
                    for tag in tags if tag in self.tags_map
                ],
                "appData": {
                    "org.standardnotes.sn": {
                        "client_updated_at": datetime.now(
                            timezone.utc
                        ).isoformat()
                    }
                }
            }
        }
        return note_uuid, note_item

    def create_tag_items(self) -> List[Dict]:
        """Создает items для всех тегов."""
        tag_items = []
        for tag_name, tag_uuid in self.tags_map.items():
            references = []
            for note_uuid, note_tags in self.note_tag_map.items():
                if tag_uuid in note_tags:
                    references.append({
                        "content_type": "Note",
                        "uuid": note_uuid
                    })
            tag_items.append({
                "uuid": tag_uuid,
                "content_type": "Tag",
                "content": {
                    "title": tag_name,
                    "references": references
                }
            })
        return tag_items

    def convert(self, ignore_dirs=None) -> int:
        """Конвертирует весь vault."""
        if ignore_dirs is None:
            ignore_dirs = {'.git', '.obsidian', '.DS_Store', '__pycache__'}

        processed_count = 0
        for root, dirs, files in os.walk(self.vault_path):
            dirs[:] = [d for d in dirs if d not in ignore_dirs]
            for filename in files:
                if not filename.endswith('.md'):
                    continue
                filepath = Path(root) / filename
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        file_content = f.read()

                    frontmatter_tags = self.extract_frontmatter_tags(
                        file_content
                    )
                    note_content = self.remove_frontmatter(file_content)
                    dir_tags = self.path_to_tags(filepath)

                    all_tags = [t.lower() for t in dir_tags + frontmatter_tags]

                    tag_uuids = set()
                    for tag_name in all_tags:
                        if tag_name not in self.tags_map:
                            self.tags_map[tag_name] = str(uuid.uuid4())
                        tag_uuids.add(self.tags_map[tag_name])

                    note_uuid, note_item = self.create_note_item(
                        filepath, filepath.stem, note_content, all_tags
                    )
                    self.items.append(note_item)
                    self.note_tag_map[note_uuid] = tag_uuids
                    processed_count += 1
                except Exception as e:
                    print(f"  ERROR: {e}")
        self.items.extend(self.create_tag_items())
        return processed_count

    def save_json(self, output_path: str) -> None:
        """Сохраняет результат в JSON."""
        import_data = {"version": "004", "items": self.items}
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(import_data, f, indent=2, ensure_ascii=False)
        notes = [i for i in self.items if i['content_type'] == 'Note']
        tags = [i for i in self.items if i['content_type'] == 'Tag']
        print(f"Generated: {len(notes)} notes, {len(tags)} tags")
        print(f"Saved to: {output_path}")


def main():
    parser = argparse.ArgumentParser(
        description='Obsidian vault → Standard Notes JSON'
    )
    parser.add_argument('--vault', required=True)
    parser.add_argument('--output', default='standard_notes_import.json')
    parser.add_argument('--ignore', nargs='+',
                        default=['.git', '.obsidian', '.DS_Store'])
    args = parser.parse_args()

    vault_path = Path(args.vault)
    if not vault_path.is_dir():
        print(f"ERROR: {vault_path}")
        return 1

    converter = ObsidianToStandardNotes(str(vault_path))
    processed = converter.convert(ignore_dirs=set(args.ignore))
    converter.save_json(args.output)
    return 0 if processed else 1


if __name__ == '__main__':
    exit(main())
```

</details>

### Вложения

Standard Notes не поддерживает импорт файлов через JSON — файловая система
использует E2E-шифрование и отдельный механизм загрузки.

Ссылки на вложения (`![[Attachments/file.png]]`) импортируются как текст.
Файлы нужно загрузить вручную через интерфейс Standard Notes. В моём случае
всего 28 заметок содержали ссылки на вложения — посильно для ручной работы.

### Формат заметок

Импортированные заметки создаются в формате plain text. Standard Notes
поддерживает Rich text редактор (Super Editor), но конвертация markdown в
Lexical JSON (формат Super Editor) оказалась ненадёжной — проще переключить
тип редактора для нужных заметок вручную.

## Обновление

В каждом контейнере указан `AutoUpdate=registry` — Podman периодически
проверяет наличие новых образов и обновляет контейнеры автоматически. Можно
также запустить обновление вручную:

```bash
podman auto-update
```

После обновления `standardnotes` (API-сервер) миграции базы данных
выполняются автоматически при старте контейнера.

## Резервное копирование

E2E-шифрование защищает от компрометации сервера, но не от потери данных.
Если MySQL умрёт без бекапа — заметки потеряны, даже с ключами на клиенте.

Минимум для резервного копирования:

- **MySQL** — `mysqldump` через `podman exec`:

```bash
podman exec standardnotes-db mysqldump -u std_notes_user -p standard_notes_db > sn_backup.sql
```

- **Uploads** — `~/volumes/standardnotes/uploads/`
- **Ключи** — `standardnotes.env` (без него сервер не расшифрует данные)

Автоматизировать можно через systemd timer — ежедневный дамп базы
с ротацией старых копий. Минимальная страховка, которая спасёт от неприятных
сюрпризов.

Дополнительно Standard Notes позволяет экспортировать заметки на клиенте:
**Preferences → Backups → Download Backup**. Файл расшифрован — это страховка
на случай полной потери сервера.

## Результат

Что получилось:

- **244 заметки** импортированы с тегами по структуре директорий
- **19 тегов** отражают организацию vault'а
- Полноценная синхронизация между macOS, iOS и веб-интерфейсом
- E2E-шифрование — сервер хранит только зашифрованные данные
- Полный контроль над данными на собственном сервере
- PRO-функциональность без абонентской платы

Главное, к чему нужно быть готовым:

1. **Архитектура избыточна** — 5 контейнеров для заметочника это много.
   LocalStack с эмуляцией AWS можно было бы заменить чем-то проще,
   но Standard Notes так устроен
2. **Hardcoded URLs** в веб-приложении — приходится патчить через nginx
3. **Подписка через SQL** — работает, но не самый элегантный способ
4. **Импорт ограничен** — файлы нельзя импортировать автоматически

Несмотря на шероховатости развёртывания, Standard Notes в эксплуатации работает
надёжно. E2E-шифрование, кроссплатформенность и нативные приложения
перевешивают сложность начальной настройки.
