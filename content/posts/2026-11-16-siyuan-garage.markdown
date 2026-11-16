---
title: "Из Standard Notes в SiYuan: свой S3 на Garage и перенос заметок"
slug: siyuan-garage
date: 2026-11-16T12:20:00+0300
tags:
  - notes
  - siyuan
  - s3
  - self-hosted
---

Весной я поднял свой сервер Standard Notes и перенёс туда заметки. Полгода
спустя они живут уже в SiYuan, а синхронизация идёт через мой собственный S3 на
Garage. В этой статье — почему я ушёл от Standard Notes, на чём остановился, как
поднимал хранилище и как переносил 275 заметок вместе с вложениями. В конце —
замеры скорости.

## С чего всё началось

Долгое время у меня была только техника Apple, и заметки жили в Notes.app. Это
удобный вариант, пока все устройства из одной экосистемы: приложение уже стоит,
синхронизация через iCloud просто работает. Переход на Android это равновесие
сломал. С телефона на Android до Notes.app нормально не добраться, а держать
заметки там, куда половина устройств не дотягивается, бессмысленно.

Нужен был сервис с клиентами под все мои платформы, и я выбрал Standard Notes.
Он шифрует заметки на устройстве, сервер видит только зашифрованные данные, а
сам сервер можно поставить у себя. Официальным облаком я пользоваться не стал и
сразу развернул свой сервер, о чём подробно рассказал в отдельной
статье[^sn-post]. Клиентские функции, например редактор Super, свой сервер не
открывает: их проверяет сам клиент, а ключ подписывает инфраструктура Standard
Notes. Поэтому Premium я купил отдельно, офлайн-лицензией.

## Почему не прижилось

Формально жаловаться было не на что. Сервер работал без сбоев, заметки
синхронизировались между телефоном и Mac, шифрование делало своё дело. И всё
же работать с заметками мне так и не стало удобно. Это то ощущение, которое
трудно разложить на пункты: вроде бы всё на месте, а инструмент так и не стал
своим.

Были и серверные шероховатости. Ради заметок на сервере крутились четыре
контейнера, включая LocalStack, который эмулирует очереди AWS. А образ
сервера Standard Notes с апреля 2026 года ни разу не обновлялся, хотя клиенты
продолжают выходить.

## SiYuan

Следующим я попробовал SiYuan[^siyuan] и задержался в нём. Он устроен иначе:
каждый абзац, заголовок или элемент списка — отдельный блок, на который можно
сослаться из другой заметки. Есть двусторонние ссылки, таблицы-базы данных,
формулы и диаграммы, аннотации к PDF, редактор Markdown, который сразу
показывает оформление. Клиенты есть для macOS, Windows, Linux, Android и iOS.

Меня зацепили две вещи: как выглядят заметки и сколько умеют клиенты. При этом
SiYuan распространяется под AGPLv3 и хранит всё локально, а синхронизацию шифрует
ключом, который есть только на устройствах, как и Standard Notes.

## Подписка

Базовые функции SiYuan бесплатны. Платить нужно за синхронизацию и часть
возможностей, и здесь у проекта две площадки с разными ценами[^pricing]:

| | Китайский сайт | Международный сайт |
| --- | --- | --- |
| PRO, разовая покупка | ¥80 | $64 |
| Подписка с официальным облаком | ¥148 в год | $148 |

На китайском сайте дешевле, и начал я с него. Дальше регистрации дело не пошло:
сайт не принял мой номер телефона. Международный сайт регистрирует по email и
принимает оплату в долларах. Там я и оформил подписку. Сейчас она временно
продаётся бессрочно за $148, мест по этой цене ограниченное число. В неё входят
функции PRO, 8 ГБ в официальном облаке, облачный ящик для входящих и хостинг
вложений. Деньги после оплаты не возвращают, но перед покупкой подписку можно
попробовать: пробный период включается в настройках аккаунта десктоп-клиента.

Для этой истории важнее другое. И PRO, и подписка позволяют синхронизироваться
через собственный S3 или WebDAV. Хранилище в цену не входит, его нужно купить
или поднять самому. Сервер у меня уже есть, поэтому синхронизацию я перенёс на
него, и объём теперь ограничен только его диском.

## Свой S3

### Что нужно SiYuan от сервера

Прежде чем выбирать сервер, я посмотрел, как SiYuan работает с S3. Клиент
синхронизации лежит в библиотеке dejavu[^dejavu]. Он использует aws-sdk-go-v2 и
небольшой набор вызовов: одиночный `PutObject` без multipart, `ListObjects` первой
версии с постраничным `Marker`, `GetObject` с `If-None-Match`, `HeadObject`,
`DeleteObject` и `ListBuckets`. Контрольные суммы, которые SDK шлёт по умолчанию
с 2025 года, клиент выключает. Поэтому совместимость сервера с ними для SiYuan
не важна.

Данные в бакете SiYuan шифрует ключом репозитория, тем же, что и в официальном
облаке. Полная копия заметок лежит на каждом устройстве. Сервер здесь только
передаёт изменения между ними.

### Почему Garage

Я сравнил несколько вариантов для одного сервера и одного пользователя:

- MinIO отпал первым. Репозиторий community-версии переведён в архив, готовые
  сборки больше не выпускаются[^minio].
- RustFS вышел в версии 1.0 только в сентябре 2026 года, и к ноябрю у него
  набралось 43 security advisory.
- SeaweedFS давно работает в production, но состоит из нескольких компонентов.
  Для нескольких гигабайт это лишнее.
- Versity S3 Gateway хранит объекты обычными файлами. Это удобно для бэкапа, и я
  оставил его запасным вариантом.

Выбрал Garage[^garage]. Он рассчитан на небольшие установки, по документации ему
хватает 1 ГБ памяти, проект живой: версия 2.5.0 вышла в октябре. С версии 2.3.0 у сервера есть
флаг `--single-node`, который сам настраивает кластер из одного узла.

Одна оговорка. Документация Garage прямо называет `replication_factor = 1`
режимом для тестов[^replication]. Для SiYuan я с этим согласился: потеря сервера
не теряет заметок, они есть на всех устройствах. Чтобы снизить риск, метаданные
лежат в sqlite с синхронной записью на диск. Каталог Garage каждую ночь уходит в
бэкап, базу метаданных бэкап снимает согласованным снимком.

### Конфигурация

`garage.toml` без секретов. Секрет RPC Garage читает из переменной
`GARAGE_RPC_SECRET`:

```toml
metadata_dir = "/var/lib/garage/meta"
data_dir = "/var/lib/garage/data"
db_engine = "sqlite"
metadata_fsync = true
data_fsync = true
metadata_auto_snapshot_interval = "24h"

replication_factor = 1

rpc_bind_addr = "[::]:3901"
rpc_public_addr = "127.0.0.1:3901"

[s3_api]
s3_region = "garage"
api_bind_addr = "[::]:3900"
public_endpoint = "https://s3.example.org"
```

Регион обязателен, и в нём не должно быть подчёркивания: с регионом `zh_cn`
SiYuan после обновления SDK перестал подключаться[^region]. Адресация только
path-style, поэтому `root_domain` и wildcard-сертификат не нужны.

### Запуск

Garage работает в Docker Compose. Каталог проекта выглядит так:

```text
garage/
├── compose.yaml
├── garage.env
├── config/
│   └── garage.toml
├── meta/
└── data/
```

`compose.yaml`:

```yaml
services:
  garage:
    image: dxflrs/garage:v2.5.0
    container_name: garage
    restart: unless-stopped
    command: ["/garage", "server", "--single-node"]
    env_file: garage.env
    environment:
      GARAGE_CONFIG_FILE: /etc/garage/garage.toml
    volumes:
      - ./config:/etc/garage:ro
      - ./meta:/var/lib/garage/meta
      - ./data:/var/lib/garage/data
    healthcheck:
      test: ["CMD", "/garage", "status"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - default
      - caddy

networks:
  caddy:
    external: true
```

Порты контейнер наружу не публикует: S3 доступен только через Caddy, а порт
RPC 3901 нужен самому Garage внутри контейнера. Конфиг смонтирован каталогом,
а не отдельным файлом. Если монтировать файл, а потом заменить его на хосте
редактором или `git checkout`, контейнер продолжит видеть старую версию.

Флаг `--single-node` появился в 2.3.0. При первом старте он создаёт layout из
одного узла, при следующих ничего не меняет. На более старых версиях layout
задают вручную командами `garage layout assign` и `garage layout apply`.

Секрет RPC — 32 случайных байта в hex:

```bash
printf 'GARAGE_RPC_SECRET=%s\n' "$(openssl rand -hex 32)" > garage.env
chmod 600 garage.env
```

В Caddy достаточно одного блока. Caddy и Garage должны быть в общей внешней
сети `caddy`, её создают один раз командой `docker network create caddy`:

```text
s3.example.org {
    reverse_proxy garage:3900
}
```

DNS-записи для домена указывают прямо на сервер, без CDN-прокси. Через прокси
Cloudflare у пользователей SiYuan запросы к S3 ломались на проверке подписи с
ошибкой `SignatureDoesNotMatch`[^cloudflare].

Запуск и проверка:

```bash
docker compose up -d --wait
docker exec garage /garage status
```

В журнале первого старта появляется строка `Created initial layout for
single-node configuration`. `garage status` показывает один узел в разделе
`HEALTHY NODES`, его ёмкость и свободное место на диске.

Ключ и бакет создаются командами внутри контейнера. `key create` печатает
`Key ID` и `Secret key`, их потом вводят в SiYuan:

```bash
docker exec garage /garage key create siyuan
docker exec garage /garage bucket create siyuan
docker exec garage /garage bucket allow --read --write --owner siyuan --key siyuan
```

### Проверка клиентом SiYuan

До переключения устройств я проверил сервер тем же кодом, что внутри SiYuan.
Небольшая программа на Go вызывала функции `dejavu/cloud` с настройками SiYuan:
загрузка 5 МБ, чтение с побайтовой сверкой, листинг 40 объектов страницами по 32,
ответ 404 на отсутствующий объект, удаление. Всё прошло.

По дороге нашлась одна шероховатость, но не у SiYuan. `aws s3 rm` из aws-cli
через Caddy падает с ошибкой `signed header content-length is not present`.
Напрямую в Garage та же команда работает. При проксировании DELETE без тела
теряется заголовок `Content-Length: 0`, а aws-cli включает его в подпись. Клиент
SiYuan этот заголовок не подписывает. Обслуживание через aws-cli я делаю изнутри
Docker-сети.

### Переключение устройств

С версии 3.8.5 SiYuan умеет менять источник синхронизации без потери данных: перед
сменой он делает полный локальный снимок, а в пустой бакет просто загружает
всё[^switch]. Поля настроек:

| Поле | Значение |
| --- | --- |
| Endpoint | `s3.example.org` |
| Bucket | `siyuan` |
| Region ID | `garage` |
| Addressing | Path-style |
| TLS Verify | Verify |

Mac я переключил первым и дождался полной загрузки. На Android встроенный импорт
файла настроек выдал ошибку, поэтому поля я ввёл вручную. Дальше телефон
синхронизировался без замечаний.

## Перенос заметок

### Что оказалось в бэкапе

Сервер Standard Notes хранит заметки зашифрованными, поэтому начинать нужно с
расшифрованного бэкапа из десктоп-клиента: Preferences → Backups → Download
backup, вариант Decrypted. Внутри один JSON со всеми объектами аккаунта.

Сюрпризов было два.

Первый: все заметки хранились в формате Super, то есть как JSON-дерево
редактора Lexical: абзацы, заголовки, списки, код, таблицы, ссылки, цитаты,
встроенные файлы. Готового конвертера в SiYuan я не нашёл, поэтому написал свой
перевод в Markdown.

Второй: файлов в бэкапе нет. В нём лежат только их метаданные и ключи. Сами файлы
сервер хранит зашифрованными. Зато, раз сервер свой, их можно расшифровать
напрямую. Standard Notes шифрует каждый файл потоковым шифром libsodium
`crypto_secretstream_xchacha20poly1305`: ключ `key` в hex, заголовок
`encryptionHeader` в base64. Associated data — `remoteIdentifier` файла, без него
расшифровка не проходит[^decryptor]. Так каждый файл точно привязывается к своей
заметке по uuid, даже если имена файлов повторяются. У меня таких повторов было 34.

### Скрипты

Перенос делают четыре небольших скрипта[^gist]:

- `sn2siyuan.py` переводит бэкап в каталог Markdown-файлов с front matter и
  расшифрованными вложениями в `assets/`. Заметки из корзины пропускаются. Файлы
  без заметок собираются в документ «Файлы без заметок».
- `sy.py` — минимальный клиент API SiYuan.
- `strip_yaml.py` убирает блоки front matter, которые SiYuan оставляет после
  импорта.
- `verify.py` сверяет импорт с бэкапом: заголовки, даты создания и изменения,
  теги и текст. Каждое слово заметки должно найтись в документе SiYuan.

SiYuan при импорте Markdown читает из front matter `title`, `date` (из него
получается время создания), `lastmod` (время изменения) и `tags`. Время в
front matter должно быть локальным: SiYuan разбирает его в часовом поясе
компьютера.

Порядок работы такой. SiYuan должен быть запущен. Токен API лежит в Settings →
Authentication → API token.

```bash
# зашифрованные файлы аккаунта с сервера Standard Notes
ssh server 'sudo tar -C <uploads>/<user-uuid> -cf - .' | tar -C enc -xf -

uv run --no-project --with pynacl python sn2siyuan.py backup.json enc out

export SIYUAN_TOKEN=...
python3 sy.py /api/notebook/createNotebook '{"name":"Standard Notes"}'
python3 sy.py /api/import/importStdMd \
  '{"notebook":"<id>","localPath":"out/Standard Notes","toPath":"/","skipRoot":true}'
python3 strip_yaml.py <id>
python3 verify.py backup.json <id>
```

Исходный код тот же, что в gist[^gist]. Его можно раскрыть прямо здесь.

<details>
<summary>sn2siyuan.py — конвертер бэкапа</summary>

```python
"""Convert a decrypted Standard Notes backup (Super notes) into Markdown for SiYuan import.

Usage: sn2siyuan.py BACKUP_JSON ENC_DIR OUT_DIR [--only uuid-prefix,...]

- Notes in the trash are skipped.
- Super (Lexical JSON) is rendered to Markdown; front matter carries title,
  date (creation, local time), lastmod (client update, local time) and tags.
- Files are decrypted from ENC_DIR/<remoteIdentifier> (libsodium secretstream,
  associated data = remoteIdentifier) into OUT_DIR/<notebook>/assets/.
- Files not linked to any kept note go to one document "Файлы без заметок".
"""
import base64
import json
import re
import sys
import unicodedata
from datetime import datetime
from pathlib import Path

from nacl import bindings as sodium

NOTEBOOK = "Standard Notes"
ORPHANS_TITLE = "Файлы без заметок"
FORMATS = [(16, "`", "`"), (1, "**", "**"), (2, "*", "*"), (4, "~~", "~~"),
           (8, "<u>", "</u>"), (128, "==", "=="), (32, "<sub>", "</sub>"), (64, "<sup>", "</sup>")]
warnings = []


def local_time(iso):
    return datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone().strftime("%Y-%m-%d %H:%M:%S")


def safe_name(name, fallback="file"):
    name = unicodedata.normalize("NFC", name or "").strip()
    name = re.sub(r"[^\w.\-]+", "_", name, flags=re.UNICODE).strip("._") or fallback
    return name[:120]


ESCAPE = re.compile(r"([\\`*_\[\]<>~$^|#])")


def escape_text(text):
    text = ESCAPE.sub(r"\\\1", text)
    return text.replace("==", r"\=\=").replace("((", r"\(\(").replace("{{", r"\{\{")


LINE_START = re.compile(r"^(\s*)([-+>]|\d+[.)])(?=\s|$)", re.M)


def protect_line_starts(text):
    return LINE_START.sub(lambda m: m.group(1) + m.group(2).replace(".", r"\.").replace(")", r"\)") if m.group(2)[0].isdigit()
                          else m.group(1) + "\\" + m.group(2), text)


def code_span(text):
    ticks = max((len(m) for m in re.findall(r"`+", text)), default=0) + 1
    pad = " " if text.startswith("`") or text.endswith("`") else ""
    return "`" * ticks + pad + text + pad + "`" * ticks


# Markdown pasted into a Super note as plain text: headings from ## (a lone # is
# usually a shell comment), table separator rows, fences, bold, code spans, links.
MARKDOWN_SIGN = re.compile(r"^#{2,6} \S|^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$|^```"
                           r"|\*\*\S(?:[^*\n]*\S)?\*\*|`[^`\n]+`|\[[^\]\n]+\]\([^)\s]+\)", re.M)


def plain_text(n):
    """Text of a paragraph made only of unformatted text, otherwise None."""
    kids = n.get("children", [])
    if n.get("type") != "paragraph" or any(
            k.get("type") not in ("text", "linebreak", "tab") or k.get("format") for k in kids):
        return None
    return "".join({"linebreak": "\n", "tab": "\t"}.get(k["type"], k.get("text", "")) for k in kids)


class Converter:
    def __init__(self, assets):
        self.assets = assets          # fileUuid -> (asset path, name, mime)
        self.embedded = set()

    def inline(self, nodes):
        # Adjacent text runs with the same outer formatting (everything but code)
        # are wrapped once, otherwise **a** + **`b`** renders as **a****`b`**.
        groups = []
        for n in nodes:
            if n.get("type") in ("text", "hashtag"):
                outer = (n.get("format") or 0) & ~16
                if groups and isinstance(groups[-1], list) and groups[-1][0] == outer:
                    groups[-1][1].append(n)
                else:
                    groups.append([outer, [n]])
            else:
                groups.append(n)
        out = []
        for n in groups:
            if isinstance(n, list):
                fmt, runs = n
                s = "".join(code_span(r.get("text", "")) if (r.get("format") or 0) & 16
                            else escape_text(r.get("text", "")) for r in runs)
                # keep surrounding spaces outside of emphasis markers
                lead, core, trail = re.match(r"^(\s*)(.*?)(\s*)$", s, re.S).groups()
                if core:
                    for bit, a, b in FORMATS:
                        if bit != 16 and fmt & bit:
                            core = a + core + b
                out.append(lead + core + trail)
                continue
            t = n.get("type")
            if t == "code-highlight":
                out.append(code_span(n.get("text", "")))
            elif t == "linebreak":
                out.append("\n")
            elif t == "tab":
                out.append("\t")
            elif t in ("link", "autolink"):
                url = (n.get("url") or "").strip()
                label = self.inline(n.get("children", [])) or escape_text(url)
                out.append(f"[{label}](<{url}>)" if url else label)
            elif t == "snfile":
                out.append(self.file_ref(n.get("fileUuid")))
            elif t == "unencrypted-image":
                out.append(f"![{escape_text(n.get('alt', ''))}](<{n.get('src', '')}>)")
            elif t == "paragraph":
                out.append(self.inline(n.get("children", [])) + "\n")
            elif t == "code":
                out.append("\n" + self.code(n) + "\n")
            else:
                warnings.append(f"inline node {t}")
                out.append(self.inline(n.get("children", [])))
        return "".join(out)

    def file_ref(self, uuid):
        if uuid not in self.assets:
            warnings.append(f"missing file {uuid}")
            return ""
        self.embedded.add(uuid)
        path, name, mime = self.assets[uuid]
        return f"{'!' if mime.startswith('image/') else ''}[{escape_text(name)}](<{path}>)"

    def paragraph(self, n):
        text = self.inline(n.get("children", [])).strip("\n")
        return protect_line_starts(text).lstrip(" ") if text.strip() else None

    def list_block(self, n, depth=0):
        lines, typ, num = [], n.get("listType"), n.get("start", 1) or 1
        pad = "    " * depth
        for item in n.get("children", []):
            kids = item.get("children", [])
            if kids and all(k.get("type") == "list" for k in kids):
                for k in kids:
                    lines.extend(self.list_block(k, depth + 1))
                continue
            if typ == "number":
                marker = f"{num}. "
                num += 1
            elif typ == "check":
                marker = "- [x] " if item.get("checked") else "- [ ] "
            else:
                marker = "- "
            inline_kids = [k for k in kids if k.get("type") != "list"]
            text = protect_line_starts(self.inline(inline_kids).strip("\n")) or "​"
            body = text.split("\n")
            lines.append(pad + marker + body[0])
            lines.extend(pad + " " * len(marker) + b for b in body[1:])
            for k in kids:
                if k.get("type") == "list":
                    lines.extend(self.list_block(k, depth + 1))
        return lines

    def table(self, n):
        rows = []
        for r in n.get("children", []):
            cells = []
            for c in r.get("children", []):
                parts = [self.inline(p.get("children", [])) for p in c.get("children", [])]
                cells.append("<br>".join(p.replace("\n", "<br>") for p in parts if p.strip()) or " ")
            rows.append(cells)
        if not rows:
            return None
        width = max(len(r) for r in rows)
        rows = [r + [" "] * (width - len(r)) for r in rows]
        out = ["| " + " | ".join(rows[0]) + " |", "|" + " --- |" * width]
        out += ["| " + " | ".join(r) + " |" for r in rows[1:]]
        return "\n".join(out)

    def code(self, n):
        # URLs inside code are autolink nodes whose text lives in their children.
        def flat(kids):
            return "".join("\n" if c.get("type") == "linebreak" else "\t" if c.get("type") == "tab"
                           else c.get("text", "") + flat(c.get("children", [])) for c in kids)
        text = flat(n.get("children", []))
        fence = "`" * max(3, max((len(m) for m in re.findall(r"`{3,}", text)), default=0) + 1)
        return f"{fence}{n.get('language') or ''}\n{text}\n{fence}"

    def block(self, n):
        t = n.get("type")
        if t == "paragraph":
            return self.paragraph(n)
        if t == "heading":
            text = self.inline(n.get("children", [])).replace("\n", " ").strip()
            return "#" * int(n.get("tag", "h1")[1]) + " " + text if text else None
        if t == "quote":
            text = protect_line_starts(self.inline(n.get("children", [])).strip("\n"))
            return "\n".join("> " + l for l in text.split("\n")) if text.strip() else None
        if t == "code":
            return self.code(n)
        if t == "list":
            return "\n".join(self.list_block(n))
        if t == "table":
            return self.table(n)
        if t == "horizontalrule":
            return "---"
        if t in ("snfile", "unencrypted-image"):
            return self.inline([n])
        warnings.append(f"block node {t}")
        return self.inline(n.get("children", [])) or None

    def document(self, root):
        kids = root.get("children", [])
        plain = [plain_text(b) for b in kids]
        if len(MARKDOWN_SIGN.findall("\n".join(p for p in plain if p is not None))) < 2:
            blocks = [self.block(b) for b in kids]
            return "\n\n".join(b for b in blocks if b)
        # Pasted Markdown keeps one source line per paragraph, so a run of plain
        # paragraphs is the original text and goes out unescaped.
        parts, run = [], []
        for b, p in zip(kids, plain):
            if p is not None:
                run.append(p)
                continue
            parts += ["\n".join(run).strip("\n"), self.block(b)]
            run = []
        parts.append("\n".join(run).strip("\n"))
        return "\n\n".join(p for p in parts if p and p.strip())


def decrypt(item, enc_dir):
    f = item["content"]
    data = (enc_dir / f["remoteIdentifier"]).read_bytes()
    state = sodium.crypto_secretstream_xchacha20poly1305_state()
    sodium.crypto_secretstream_xchacha20poly1305_init_pull(
        state, base64.b64decode(f["encryptionHeader"]), bytes.fromhex(f["key"]))
    parts, pos = [], 0
    for size in f["encryptedChunkSizes"]:
        msg, _ = sodium.crypto_secretstream_xchacha20poly1305_pull(
            state, data[pos:pos + size], f["remoteIdentifier"].encode())
        parts.append(msg)
        pos += size
    plain = b"".join(parts)
    if len(plain) != f["decryptedSize"]:
        raise ValueError(f"size mismatch for {f['name']}")
    return plain


def front_matter(title, created, updated, tags):
    lines = ["---", f"title: {json.dumps(title, ensure_ascii=False)}",
             f'date: "{created}"', f'lastmod: "{updated}"']
    if tags:
        lines.append("tags: " + json.dumps(sorted(tags), ensure_ascii=False))
    return "\n".join(lines + ["---", ""])


def main():
    backup, enc_dir, out_dir = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
    only = sys.argv[sys.argv.index("--only") + 1].split(",") if "--only" in sys.argv else None
    items = json.loads(backup.read_text())["items"]
    notes = [i for i in items if i["content_type"] == "Note" and not i.get("deleted")
             and not i["content"].get("trashed")]
    if only:
        notes = [n for n in notes if any(n["uuid"].startswith(p) for p in only)]
    keep = {n["uuid"] for n in notes}
    tags = {}
    for t in (i for i in items if i["content_type"] == "Tag" and not i.get("deleted")):
        for r in t["content"].get("references", []):
            if r.get("content_type") == "Note":
                tags.setdefault(r["uuid"], set()).add(t["content"]["title"])

    book = out_dir / NOTEBOOK
    (book / "assets").mkdir(parents=True, exist_ok=True)
    assets, linked, used_names = {}, {}, set()
    files = [i for i in items if i["content_type"] == "SN|File" and not i.get("deleted")]
    for f in files:
        c = f["content"]
        notes_of_file = [r["uuid"] for r in c.get("references", []) if r.get("reference_type") == "FileToNote"]
        if only and not set(notes_of_file) & keep:
            continue
        name = safe_name(c["name"])
        if name.casefold() in used_names:   # APFS is case-insensitive
            stem, dot, ext = name.rpartition(".")
            name = f"{stem or ext}-{f['uuid'][:8]}{dot + ext if stem else ''}"
        used_names.add(name.casefold())
        (book / "assets" / name).write_bytes(decrypt(f, enc_dir))
        assets[f["uuid"]] = (f"assets/{name}", c["name"], c.get("mimeType") or "")
        for nu in notes_of_file:
            linked.setdefault(nu, []).append(f["uuid"])

    conv, used_docs, written = Converter(assets), set(), 0
    for n in notes:
        c = n["content"]
        title = (c.get("title") or "").strip() or "Без названия"
        body = ""
        if (c.get("text") or "").strip():
            try:
                body = conv.document(json.loads(c["text"])["root"])
            except (json.JSONDecodeError, KeyError):
                warnings.append(f"not Super JSON: {title}")
                body = protect_line_starts(escape_text(c["text"]))
        extra = [u for u in linked.get(n["uuid"], []) if f"]({assets[u][0]})" not in body
                 and f"](<{assets[u][0]}>)" not in body]
        if extra:
            body += ("\n\n" if body else "") + "Вложения:\n\n" + "\n".join("- " + conv.file_ref(u) for u in extra)
        updated = (c.get("appData") or {}).get("org.standardnotes.sn", {}).get("client_updated_at") or n["updated_at"]
        doc = safe_name(title, "note")
        while doc.casefold() in used_docs:   # APFS is case-insensitive
            doc += "_"
        used_docs.add(doc.casefold())
        (book / f"{doc}.md").write_text(
            front_matter(title, local_time(n["created_at"]), local_time(updated), tags.get(n["uuid"])) + "\n" + body + "\n")
        written += 1

    orphans = [u for u in assets if not any(u in v for k, v in linked.items() if k in keep)]
    if orphans:
        lines = ["- " + conv.file_ref(u) for u in sorted(orphans, key=lambda u: assets[u][1].lower())]
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        (book / f"{ORPHANS_TITLE}.md").write_text(
            front_matter(ORPHANS_TITLE, now, now, None) + "\nФайлы из Standard Notes, не привязанные ни к одной заметке.\n\n"
            + "\n".join(lines) + "\n")
    print(f"notes {written}, files {len(assets)}, orphan files {len(orphans)}")
    for w in sorted(set(warnings)):
        print("warning:", w, f"x{warnings.count(w)}")


if __name__ == "__main__":
    main()
```

</details>

<details>
<summary>sy.py — клиент API SiYuan</summary>

```python
"""Minimal SiYuan kernel API client: sy.py PATH [JSON] prints the response data.

SIYUAN_URL defaults to http://127.0.0.1:6806. SIYUAN_TOKEN is the API token from
Settings -> Authentication -> API token; without it the token is read from the
desktop app's conf.json on macOS.
"""
import json, os, sys, urllib.request
from pathlib import Path

URL = os.environ.get("SIYUAN_URL", "http://127.0.0.1:6806").rstrip("/")
TOKEN = os.environ.get("SIYUAN_TOKEN") or json.loads(
    (Path.home() / "Library/Application Support/SiYuan/conf/conf.json").read_text())["api"]["token"]
conf = {"api": {"token": TOKEN}}


def api(path, body=None):
    r = urllib.request.Request(URL + path, json.dumps(body or {}).encode(),
                               {"Authorization": "Token " + TOKEN, "Content-Type": "application/json"})
    res = json.load(urllib.request.build_opener(urllib.request.ProxyHandler({})).open(r, timeout=600))
    if res.get("code") != 0:
        raise SystemExit(f"{path}: {res}")
    return res.get("data")


if __name__ == "__main__":
    print(json.dumps(api(sys.argv[1], json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}), ensure_ascii=False, indent=1))
```

</details>

<details>
<summary>strip_yaml.py — удаление блоков front matter</summary>

```python
"""Delete the front-matter code block SiYuan inserts at the top of imported docs: strip_yaml.py NOTEBOOK_ID

Deleting the only block of an empty note makes SiYuan insert an empty paragraph
asynchronously and bump the document's updated time, so the original times are
restored after all transactions are flushed.
"""
import json, sys, time
from sy import api
box = sys.argv[1]
api("/api/sqlite/flushTransaction")
rows = api("/api/query/sql", {"stmt": f"""SELECT b.id, b.root_id, b.content, d.content AS title FROM blocks b JOIN blocks d ON d.id = b.root_id
  WHERE b.box = '{box}' AND b.parent_id = b.root_id AND d.type = 'd' AND b.type = 'c'
  AND b.content LIKE '---' || char(10) || 'title: %' LIMIT 5000"""})
before, deleted = {}, 0
for r in rows:
    first = r["content"].split("\n")[1]
    if json.loads(first[len("title: "):]) != r["title"]:
        print("skip, title differs:", r["id"], first, r["title"])
        continue
    before[r["root_id"]] = api("/api/attr/getBlockAttrs", {"id": r["root_id"]}).get("updated")
    api("/api/block/deleteBlock", {"id": r["id"]})
    deleted += 1
time.sleep(3)
api("/api/sqlite/flushTransaction")
restored = 0
for doc_id, updated in before.items():
    if updated and api("/api/attr/getBlockAttrs", {"id": doc_id}).get("updated") != updated:
        api("/api/attr/setBlockAttrs", {"id": doc_id, "attrs": {"updated": updated}})
        restored += 1
print("deleted", deleted, "of", len(rows), "| updated restored", restored)
```

</details>

<details>
<summary>verify.py — сверка импорта с бэкапом</summary>

```python
"""Compare an imported SiYuan notebook with the Standard Notes backup: verify.py BACKUP_JSON NOTEBOOK_ID"""
import json, re, sys, collections as C
from datetime import datetime
from sy import api
items = json.load(open(sys.argv[1]))["items"]; box = sys.argv[2]
def loc(iso): return datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone().strftime("%Y%m%d%H%M%S")
def text(n): return (n.get("text") or "") + " " + " ".join(text(k) for k in n.get("children") or [])
WORD = re.compile(r"\w{3,}")
notes = [i for i in items if i["content_type"] == "Note" and not i["content"].get("trashed") and not i.get("deleted")]
tags = C.defaultdict(set)
for t in (i for i in items if i["content_type"] == "Tag"):
    for r in t["content"]["references"]:
        if r["content_type"] == "Note": tags[r["uuid"]].add(t["content"]["title"])
api("/api/sqlite/flushTransaction")
docs = api("/api/query/sql", {"stmt": f"SELECT id, content, created, updated, ial, hpath FROM blocks WHERE box='{box}' AND type='d' LIMIT 5000"})
print("docs in SiYuan:", len(docs), "| notes expected:", len(notes), "+ orphans doc")
nested = [d["hpath"] for d in docs if d["hpath"].count("/") > 1]; print("nested docs:", nested[:5])
bytitle = C.defaultdict(list)
for d in docs: bytitle[d["content"]].append(d)
bad = []
for n in notes:
    c = n["content"]; title = (c.get("title") or "").strip() or "Без названия"
    upd = (c.get("appData") or {}).get("org.standardnotes.sn", {}).get("client_updated_at") or n["updated_at"]
    cand = [d for d in bytitle.get(title, []) if d["created"] == loc(n["created_at"])]
    if not cand: bad.append(("missing/created", title)); continue
    d = next((x for x in cand if x["updated"] == loc(upd)), cand[0])   # same title and creation time
    if d["updated"] != loc(upd): bad.append(("updated", title, d["updated"], loc(upd)))
    got = set(a for a in (d["ial"].split('tags="')[1].split('"')[0].split(",") if 'tags="' in d["ial"] else []) if a)
    if got != tags.get(n["uuid"], set()): bad.append(("tags", title, got, tags.get(n["uuid"])))
    # every word of the note must reach SiYuan; escapes are dropped before counting
    if (c.get("text") or "").strip():
        src = C.Counter(WORD.findall(text(json.loads(c["text"])["root"]).lower()))
        lost = min(({w: k - got[w] for w, k in src.items() if got[w] < k} for got in (C.Counter(WORD.findall(
            api("/api/export/exportMdContent", {"id": x["id"]})["content"].lower().replace("\\", ""))) for x in cand)), key=len)
        if lost: bad.append(("lost words", title, sum(lost.values()), list(lost)[:5]))
print("mismatches:", len(bad), dict(C.Counter(b[0] for b in bad))); [print("  ", b) for b in bad]
yaml_left = api("/api/query/sql", {"stmt": f"SELECT root_id, substr(content,1,50) c FROM blocks WHERE box='{box}' AND type='c' AND content LIKE '---' || char(10) || 'title:%'"})
print("front-matter blocks left:", yaml_left)
assets = api("/api/query/sql", {"stmt": f"SELECT count(DISTINCT a.path) n FROM assets a WHERE a.box='{box}'"})
print("distinct assets referenced:", assets)
```

</details>

### На что я наткнулся

- SiYuan вставляет весь front matter ещё и блоком кода в начало каждого
  документа[^yaml]. `strip_yaml.py` удаляет этот блок, если заголовок внутри
  совпадает с заголовком документа.
- Если этот блок был в документе единственным, после удаления SiYuan сам
  добавляет пустой абзац и ставит время изменения на текущее. Скрипт возвращает
  исходное время.
- Без `skipRoot` импорт создаёт лишний документ по имени папки.
- macOS не различает регистр в именах файлов. Заметки «Сертификат Детский мир» и
  «Сертификат Детский Мир» сначала попали в один файл, и одна пропала. Теперь
  конвертер сравнивает имена без учёта регистра.
- `unzip` на macOS спотыкается о кириллические имена внутри архива бэкапа. JSON
  проще достать через `zipfile` в Python.
- Ссылки без адреса в исходных заметках становятся обычным текстом. У меня такие
  были в заметках, вставленных из ответов чат-бота.
- В части заметок лежал Markdown, вставленный в Super обычным текстом: каждая
  строка — отдельный абзац, `### заголовок`, строки таблицы, `**жирный**`.
  Standard Notes показывал его буквально, и первая версия конвертера тоже его
  экранировала. Теперь, если в неформатированных абзацах заметки есть хотя бы
  два признака Markdown (заголовок от `##`, разделитель таблицы, блок кода,
  жирный текст, код в строке, ссылка), такие абзацы идут в SiYuan как есть.
  Одиночный `#` признаком не считается: так часто начинаются комментарии в
  командах shell.
- В одной заметке из команд пропали URL. Внутри блока кода Lexical хранит URL
  отдельным узлом, и его текст лежит уровнем ниже, а конвертер брал текст только
  у непосредственных узлов. Такую потерю находит сверка текста в `verify.py`.

Сначала я перенёс восемь разных заметок в пробный блокнот и проверил их глазами.
Потом удалил его и импортировал всё.

## Результат

В бэкапе было 348 заметок, 73 из них в корзине. В SiYuan перенесены 275 заметок
и 103 файла. `verify.py` сверил каждую заметку с бэкапом: заголовки, даты
создания и изменения и теги совпали у всех.

### Скорость

Объекты SiYuan в бакете почти все крошечные: из 1527 объектов медиана 288 байт,
90-й перцентиль 12 КБ, самый большой 4 МБ. Поэтому скорость синхронизации
определяет задержка запроса, а не ширина канала.

Сам S3 я мерил той же библиотекой dejavu в 8 потоков, как у SiYuan по умолчанию:

| Откуда | Задержка GET | Объекты 512 Б, запись/чтение в секунду | 4 МБ, запись/чтение |
| --- | --- | --- | --- |
| На сервере, напрямую в Garage | 1 мс | 1570 / 3195 | 240 / 586 МБ/с |
| На сервере, через Caddy | 1 мс | 1473 / 2792 | 303 / 276 МБ/с |
| С Mac через интернет | 89 мс | 87 / 87 | 10.9 / 17.2 МБ/с |

Garage и Caddy здесь не узкое место. `ping` с Mac до сервера показывает 85 мс:
восемь потоков при 89 мс на запрос дают около 90 запросов в секунду, это и есть
предел для мелких объектов. Крупные объекты идут со скоростью канала, и поток
по SSH с того же Mac даёт столько же.

Синхронизация самого SiYuan на Mac:

| Что изменилось | Время |
| --- | --- |
| Ничего | 0.45 с |
| Новый документ, 5 КБ текста | 1.4 с |
| Вложение 20 МБ | 4.2 с |
| Удалён блокнот с вложением | 1.2 с |

Новое устройство скачивает весь репозиторий за 25–27 секунд: 1549 объектов,
137 МБ. С официальным облаком SiYuan я не сравнивал: к моменту замеров все
устройства уже были на своём S3.

Standard Notes пока продолжает работать на сервере. Окончательно я его отключу,
когда поживу с SiYuan подольше.

[^sn-post]: [Заметки под контролем: развёртывание Standard Notes с E2E-шифрованием](https://www.juev.org/2026/04/02/standard-notes/), прошлая статья о своём сервере Standard Notes.
[^siyuan]: [SiYuan](https://github.com/siyuan-note/siyuan), исходный код и описание; в статье версия 3.8.10.
[^pricing]: [Цены SiYuan](https://b3log.org/siyuan/en/pricing.html) на международном сайте и [на китайском](https://b3log.org/siyuan/pricing.html), по состоянию на 16 ноября 2026 года.
[^dejavu]: [dejavu, cloud/s3.go](https://github.com/siyuan-note/dejavu/blob/317610e0795e/cloud/s3.go), клиент S3 в версии, которую использует SiYuan 3.8.10.
[^minio]: [minio/minio](https://github.com/minio/minio), репозиторий в статусе archived.
[^garage]: [Garage v2.5.0](https://git.deuxfleurs.fr/Deuxfleurs/garage/releases/tag/v2.5.0), заметки к релизу.
[^replication]: [Configuration file format](https://garagehq.deuxfleurs.fr/documentation/reference-manual/configuration/), описание `replication_factor`.
[^cloudflare]: [Issue #14223](https://github.com/siyuan-note/siyuan/issues/14223), ошибка `SignatureDoesNotMatch` при S3 за прокси Cloudflare.
[^region]: [Issue #16550](https://github.com/siyuan-note/siyuan/issues/16550), ошибка подключения к S3 после обновления SDK.
[^switch]: [Issue #19636](https://github.com/siyuan-note/siyuan/issues/19636), смена источника синхронизации с подтверждением.
[^decryptor]: [FileDecryptor.ts](https://github.com/standardnotes/app/blob/main/packages/files/src/Domain/UseCase/FileDecryptor.ts), расшифровка файлов в клиенте Standard Notes.
[^gist]: [Скрипты переноса Standard Notes → SiYuan](https://gist.github.com/juev/56fa37b7bf70b708f245e0944f6d7a8a).
[^yaml]: [Issue #16488](https://github.com/siyuan-note/siyuan/issues/16488), YAML в начале Markdown импортируется блоком кода.
