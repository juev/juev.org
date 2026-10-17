#!/usr/bin/env python3
"""Announce a freshly deployed juev.org post on Bluesky and Mastodon.

Runs as the last job of the GitHub Pages pipeline, after the site is live, so
the link in the post is guaranteed to resolve. Only posts *added* by the push
that triggered the deploy are announced; a post whose front matter says
`syndicate: false` is skipped. Re-running the job is safe: both networks are
checked for an existing announcement before a new one is created.

Standard library only - the runner has python3 and nothing else is installed.

Usage:
    python3 .github/scripts/syndicate.py --base <sha> --head <sha>
    python3 .github/scripts/syndicate.py --slug websub-static-blog
    python3 .github/scripts/syndicate.py --slug websub-static-blog --dry-run

Environment:
    BSKY_HANDLE         Bluesky handle, e.g. juev.bsky.social
    BSKY_APP_PASSWORD   Bluesky app password (not the account password)
    MASTODON_INSTANCE   e.g. https://infosec.exchange
    MASTODON_TOKEN      Mastodon user token with the write:statuses scope
    SITE_URL            defaults to https://www.juev.org
    BSKY_PDS            defaults to https://bsky.social/xrpc (points at a mock in tests)
    GITHUB_STEP_SUMMARY job summary file, written when set
"""

from __future__ import annotations

import argparse
import html
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

SITE_URL = os.environ.get("SITE_URL", "https://www.juev.org").rstrip("/")
USER_AGENT = "juev.org-syndicator/1.0 (+https://www.juev.org/)"

# Bluesky counts a post in graphemes. Code points are an upper bound for
# graphemes, so staying under the limit in code points is always safe.
BSKY_LIMIT = 300

HTTP_TIMEOUT = 30

results: list[dict] = []


# ---------------------------------------------------------------- utilities


def log(msg: str) -> None:
    print(msg, flush=True)


def http_json(method: str, url: str, payload: dict | None = None,
              headers: dict | None = None, form: dict | None = None) -> tuple[int, dict]:
    data = None
    hdrs = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    if headers:
        hdrs.update(headers)
    if form is not None:
        data = urllib.parse.urlencode(form).encode()
        hdrs["Content-Type"] = "application/x-www-form-urlencoded"
    elif payload is not None:
        data = json.dumps(payload).encode()
        hdrs["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
            body = resp.read().decode("utf-8", "replace")
            return resp.status, (json.loads(body) if body.strip() else {})
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", "replace")
        try:
            parsed = json.loads(body)
        except ValueError:
            parsed = {"raw": body[:500]}
        return exc.code, parsed


def http_bytes(url: str) -> tuple[int, bytes, str]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
            return resp.status, resp.read(), resp.headers.get("Content-Type", "")
    except urllib.error.HTTPError as exc:
        return exc.code, b"", ""


def clean_text(value: str) -> str:
    """Turn an HTML fragment from <meta> or Markdown-rendered summary into prose."""
    value = html.unescape(value)
    value = re.sub(r"<[^>]+>", "", value)
    return re.sub(r"\s+", " ", value).strip()


# ------------------------------------------------------- front matter parsing


def parse_front_matter(path: str) -> dict:
    """Parse the small YAML subset used in content/posts: scalars and string lists."""
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    m = re.match(r"^---\s*\n(.*?)\n---\s*(\n|$)", text, re.S)
    if not m:
        return {}

    data: dict = {}
    key = None
    for raw in m.group(1).splitlines():
        line = raw.rstrip()
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        item = re.match(r"^\s*-\s+(.*)$", line)
        if item and key:
            data.setdefault(key, [])
            if isinstance(data[key], list):
                data[key].append(unquote(item.group(1)))
            continue
        pair = re.match(r"^([A-Za-z_][\w-]*)\s*:\s*(.*)$", line)
        if not pair:
            continue
        key, value = pair.group(1), pair.group(2).strip()
        if value == "":
            data[key] = []  # a block list follows, maybe
        elif value.startswith("[") and value.endswith("]"):
            data[key] = [unquote(v) for v in value[1:-1].split(",") if v.strip()]
        else:
            data[key] = unquote(value)
    # an empty list for a key that never had items is a scalar-free dangling key
    for k, v in list(data.items()):
        if v == []:
            data[k] = ""
    return data


def unquote(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    return value


def truthy(value) -> bool:
    if isinstance(value, str):
        return value.strip().lower() not in ("false", "no", "0", "off", "")
    return bool(value)


def post_identity(path: str, fm: dict) -> tuple[str, datetime] | None:
    """Post slug and publication date, the two things the permalink is built from."""
    name = os.path.basename(path)
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})-(.+)\.(?:markdown|md)$", name)
    if not m:
        return None
    slug = fm.get("slug") or m.group(4)
    raw_date = fm.get("date") or f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    return slug, parse_date(str(raw_date))


def parse_date(raw: str) -> datetime:
    value = raw.strip().replace("Z", "+00:00")
    # Hugo fronts matter often writes +0300 without the colon
    value = re.sub(r"([+-]\d{2})(\d{2})$", r"\1:\2", value)
    try:
        dt = datetime.fromisoformat(value)
    except ValueError:
        dt = datetime.strptime(value[:10], "%Y-%m-%d")
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def permalink(slug: str, when: datetime) -> str:
    return f"{SITE_URL}/{when.year:04d}/{when.month:02d}/{when.day:02d}/{slug}/"


def find_post_by_slug(root: str, slug: str) -> str | None:
    posts_dir = os.path.join(root, "content", "posts")
    for name in sorted(os.listdir(posts_dir)):
        if not name.endswith((".markdown", ".md")) or name.startswith("_"):
            continue
        path = os.path.join(posts_dir, name)
        fm = parse_front_matter(path)
        ident = post_identity(path, fm)
        if ident and (ident[0] == slug or slug in name):
            return path
    return None


def added_posts(root: str, base: str, head: str) -> list[str]:
    """Files added under content/posts by the pushed range."""
    if not base or not head or set(base) == {"0"}:
        log("no usable push range (first push or force-push) - nothing to announce")
        return []
    proc = subprocess.run(
        ["git", "-C", root, "diff", "--name-only", "--diff-filter=A", base, head,
         "--", "content/posts"],
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        log(f"git diff failed: {proc.stderr.strip()}")
        return []
    return [os.path.join(root, p) for p in proc.stdout.split()
            if p.endswith((".markdown", ".md")) and not os.path.basename(p).startswith("_")]


# ------------------------------------------------------------ post content


_sitemap = {"urls": [], "at": 0.0}


def sitemap_url_for(slug: str, max_age: float = 5.0) -> str | None:
    """Find the permalink of a slug in sitemap.xml, for when the guessed date path is wrong."""
    now = time.time()
    if now - _sitemap["at"] > max_age:
        _sitemap["at"] = now
        status, body, _ = http_bytes(f"{SITE_URL}/sitemap.xml")
        if status == 200:
            _sitemap["urls"] = re.findall(r"<loc>([^<]+)</loc>", body.decode("utf-8", "replace"))
    pattern = re.compile(r"/%s/$" % re.escape(slug))
    for url in _sitemap["urls"]:
        if pattern.search(url):
            return url
    return None


def wait_for_page(slug: str, guess: str, attempts: int = 12, delay: int = 5) -> tuple[str | None, str | None]:
    """Wait for GitHub Pages to serve the post; return (url, html) or (None, None)."""
    for attempt in range(1, attempts + 1):
        status, body, _ = http_bytes(guess)
        if status == 200:
            return guess, body.decode("utf-8", "replace")
        log(f"  {guess} -> HTTP {status} (attempt {attempt}/{attempts})")
        # The date in the front matter is not always the date Hugo puts in the
        # permalink (timezone midnight), so trust the sitemap over our guess.
        found = sitemap_url_for(slug)
        if found and found != guess:
            status, body, _ = http_bytes(found)
            if status == 200:
                log(f"  using {found} from sitemap.xml")
                return found, body.decode("utf-8", "replace")
        if attempt < attempts:
            time.sleep(delay)
    return None, None


def meta_content(page: str, prop: str) -> str:
    m = re.search(
        r'<meta\s+[^>]*(?:property|name)="%s"\s+content="([^"]*)"' % re.escape(prop), page)
    if not m:
        m = re.search(
            r'<meta\s+[^>]*content="([^"]*)"\s+[^>]*(?:property|name)="%s"' % re.escape(prop), page)
    return clean_text(m.group(1)) if m else ""


def bluesky_text(title: str) -> str:
    """The title alone: the link lives in the card embed.

    That is the shape this account already publishes by hand, and it is what the
    Bluesky client itself produces when a URL is pasted into the composer - no
    URL in the text, no facets, one external card.
    """
    if len(title) <= BSKY_LIMIT:
        return title
    return title[:BSKY_LIMIT - 1].rstrip(" ,.:;-—") + "…"


def mastodon_text(title: str, url: str) -> str:
    """`title URL` on one line - the shape already in the timeline."""
    return f"{title} {url}".strip()


# ------------------------------------------------------------------ Bluesky


class Bluesky:
    def __init__(self, handle: str, password: str):
        self.handle = handle
        self.password = password
        self.pds = os.environ.get("BSKY_PDS", "https://bsky.social/xrpc").rstrip("/")
        self.token = ""
        self.did = ""

    def login(self) -> None:
        status, body = http_json("POST", f"{self.pds}/com.atproto.server.createSession",
                                 {"identifier": self.handle, "password": self.password})
        if status != 200:
            raise RuntimeError(f"createSession failed: HTTP {status} {body}")
        self.token = body["accessJwt"]
        self.did = body["did"]
        log(f"  bluesky: signed in as {body.get('handle')} ({self.did})")

    def auth(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"}

    def exists(self, rkey: str) -> bool:
        status, _ = http_json(
            "GET",
            f"{self.pds}/com.atproto.repo.getRecord?"
            + urllib.parse.urlencode({"repo": self.did, "collection": "app.bsky.feed.post",
                                      "rkey": rkey}),
            headers=self.auth())
        return status == 200

    def upload_thumb(self, image_url: str) -> dict | None:
        status, data, ctype = http_bytes(image_url)
        if status != 200 or not data or len(data) > 900_000:
            return None
        if ctype.split(";")[0] not in ("image/jpeg", "image/png", "image/webp", "image/gif"):
            return None
        req = urllib.request.Request(
            f"{self.pds}/com.atproto.repo.uploadBlob", data=data,
            headers={"Content-Type": ctype.split(";")[0], "Authorization": f"Bearer {self.token}",
                     "User-Agent": USER_AGENT}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as resp:
                return json.loads(resp.read())["blob"]
        except (urllib.error.HTTPError, KeyError, ValueError) as exc:
            log(f"  bluesky: thumbnail upload skipped ({exc})")
            return None

    def post(self, rkey: str, text: str, embed: dict | None) -> str:
        record = {
            "$type": "app.bsky.feed.post",
            "text": text,
            "createdAt": datetime.now(timezone.utc).isoformat(timespec="milliseconds")
            .replace("+00:00", "Z"),
            "langs": ["ru"],
        }
        if embed:
            record["embed"] = embed
        status, body = http_json(
            "POST", f"{self.pds}/com.atproto.repo.createRecord",
            {"repo": self.did, "collection": "app.bsky.feed.post", "rkey": rkey,
             "record": record, "validate": True},
            headers=self.auth())
        if status != 200:
            raise RuntimeError(f"createRecord failed: HTTP {status} {body}")
        return body["uri"]


def bluesky_announce(post: dict, dry_run: bool) -> tuple[str, str]:
    text = bluesky_text(post["title"])
    embed = {"$type": "app.bsky.embed.external",
             "external": {"uri": post["url"], "title": post["title"][:300],
                          "description": post["lead"][:300]}}

    payload = {"text": text, "embed": embed, "rkey": post["slug"]}
    if dry_run:
        log("  bluesky dry-run payload:\n" + json.dumps(payload, ensure_ascii=False, indent=2))
        return "dry-run", ""

    handle = os.environ.get("BSKY_HANDLE", "")
    password = os.environ.get("BSKY_APP_PASSWORD", "")
    if not handle or not password:
        return "skipped", "BSKY_HANDLE/BSKY_APP_PASSWORD not set"

    client = Bluesky(handle, password)
    client.login()
    rkey = post["slug"][:100]
    if client.exists(rkey):
        return "skipped", f"already announced (rkey {rkey})"
    if post["image"]:
        thumb = client.upload_thumb(post["image"])
        if thumb:
            embed["external"]["thumb"] = thumb
    uri = client.post(rkey, text, embed)
    return "posted", uri


# ----------------------------------------------------------------- Mastodon


class Mastodon:
    def __init__(self, instance: str, token: str):
        self.base = instance.rstrip("/")
        self.token = token
        self.account_id = ""

    def auth(self) -> dict:
        return {"Authorization": f"Bearer {self.token}"}

    def me(self) -> str:
        status, body = http_json("GET", f"{self.base}/api/v1/accounts/verify_credentials",
                                 headers=self.auth())
        if status != 200:
            raise RuntimeError(f"verify_credentials failed: HTTP {status} {body}")
        self.account_id = body["id"]
        log(f"  mastodon: signed in as @{body['acct']}")
        return self.account_id

    def exists(self, url: str) -> bool:
        status, body = http_json(
            "GET", f"{self.base}/api/v1/accounts/{self.account_id}/statuses?"
            + urllib.parse.urlencode({"limit": 40, "exclude_reblogs": "true"}),
            headers=self.auth())
        if status != 200 or not isinstance(body, list):
            return False
        needle = url.rstrip("/")
        for status in body:
            if needle in status.get("content", ""):
                return True
        return False

    def post(self, text: str, slug: str) -> str:
        status, body = http_json(
            "POST", f"{self.base}/api/v1/statuses", form={"status": text, "language": "ru",
                                                          "visibility": "public"},
            headers={**self.auth(), "Idempotency-Key": slug[:100]})
        if status not in (200, 202):
            raise RuntimeError(f"statuses failed: HTTP {status} {body}")
        return body.get("url") or body.get("uri", "")


def mastodon_announce(post: dict, dry_run: bool) -> tuple[str, str]:
    text = mastodon_text(post["title"], post["url"])
    if dry_run:
        log("  mastodon dry-run payload:\n" + json.dumps({"status": text}, ensure_ascii=False,
                                                         indent=2))
        return "dry-run", ""

    instance = os.environ.get("MASTODON_INSTANCE", "")
    token = os.environ.get("MASTODON_TOKEN", "")
    if not instance or not token:
        return "skipped", "MASTODON_INSTANCE/MASTODON_TOKEN not set"

    client = Mastodon(instance, token)
    client.me()
    if client.exists(post["url"]):
        return "skipped", "already announced"
    return "posted", client.post(text, post["slug"])


# -------------------------------------------------------------------- main


def collect_post(root: str, path: str) -> dict | None:
    fm = parse_front_matter(path)
    ident = post_identity(path, fm)
    if not ident:
        log(f"skip {os.path.basename(path)}: имя файла не похоже на дату-слаг")
        return None
    slug, when = ident
    if not truthy(fm.get("syndicate", "true")):
        log(f"skip {slug}: syndicate: false")
        return None
    if truthy(fm.get("draft", "false")):
        log(f"skip {slug}: draft")
        return None
    url = permalink(slug, when)
    url, page = wait_for_page(slug, url)
    if page is None:
        log(f"skip {slug}: permalink is not live - post not published (date in the future?)")
        return None
    title = meta_content(page, "og:title") or str(fm.get("title", "")).strip()
    lead = meta_content(page, "og:description")
    image = meta_content(page, "og:image")
    return {"slug": slug, "url": url, "title": title, "lead": lead, "image": image}


def write_summary() -> None:
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not path or not results:
        return
    lines = ["## Syndication", "", "| Post | Network | Result | Link |", "| --- | --- | --- | --- |"]
    for r in results:
        lines.append(f"| {r['slug']} | {r['network']} | {r['status']} | {r['detail']} |")
    try:
        with open(path, "a", encoding="utf-8") as fh:
            fh.write("\n".join(lines) + "\n")
    except OSError as exc:
        log(f"step summary not written: {exc}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", default=os.getcwd(), help="repository root")
    parser.add_argument("--base", default="", help="push base sha")
    parser.add_argument("--head", default="", help="push head sha")
    parser.add_argument("--slug", default="", help="announce this post instead of the push range")
    parser.add_argument("--dry-run", action="store_true", help="print payloads, post nothing")
    args = parser.parse_args()

    dry_run = args.dry_run or str(os.environ.get("DRY_RUN", "")).strip().lower() in ("1", "true", "yes")
    slug = args.slug or os.environ.get("POST_SLUG", "").strip()

    if slug:
        path = find_post_by_slug(args.root, slug)
        if not path:
            log(f"no post found for slug {slug!r}")
            return 1
        paths = [path]
    else:
        paths = added_posts(args.root, args.base, args.head)

    if not paths:
        log("no new posts in this deploy - nothing to announce")
        return 0

    failures = 0
    for path in paths:
        post = collect_post(args.root, path)
        if not post:
            continue
        log(f"announcing {post['slug']} -> {post['url']}")
        if dry_run:
            log("  (dry run: nothing will be posted)")
        for network, announce in (("bluesky", bluesky_announce), ("mastodon", mastodon_announce)):
            try:
                status, detail = announce(post, dry_run)
            except Exception as exc:  # noqa: BLE001 - one broken network must not stop the other
                status, detail = "failed", str(exc)
                failures += 1
            log(f"  {network}: {status} {detail}".rstrip())
            if status == "skipped" and "not set" in detail:
                log(f"::warning title=Syndication::{network}: {detail}")
            results.append({"slug": post["slug"], "network": network, "status": status,
                            "detail": detail})

    write_summary()
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
