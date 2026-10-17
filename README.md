# About

This directory contains data for my site, [www.juev.org](https://www.juev.org).

# How to Use

	~ $ brew install hugo
	~ $ cd juev.ru
	juev.ru $ hugo

# Syndication

Every deploy announces the posts it added on Bluesky and Mastodon
(`infosec.exchange` by default). It runs as the last job of
`.github/workflows/hugo.yaml`, after the site is live, and posts nothing when a
deploy carries no new article.

- `.github/scripts/syndicate.py` — the whole crossposter, standard library only.
- Only files **added** under `content/posts/` in the pushed range are announced;
  edits and deploys without new posts are ignored.
- `syndicate: false` in a post's front matter opts that post out. `draft: true`
  skips it as well.
- Both networks are checked for an existing announcement first: Bluesky by a
  deterministic record key (the slug), Mastodon by looking for the post URL in
  the last 40 statuses. Reruns do not duplicate.
- Text matches what the accounts already publish by hand: Bluesky gets the
  title alone with a link card (`og:title`/`og:description`/`og:image` of the
  published page), Mastodon gets `title URL` on one line. Title and teaser come
  from the live page, so an announcement cannot describe a page that failed to
  deploy; a 404 on the permalink skips the post.

## Secrets

| Name | Where it comes from |
| --- | --- |
| `BSKY_HANDLE` | Bluesky handle, `denis.evsyukov.org` — stored as a secret to keep it out of the logs |
| `BSKY_APP_PASSWORD` | bsky.app → Settings → App Passwords → Add App Password |
| `MASTODON_TOKEN` | infosec.exchange → Preferences → Development → New application, scopes `write:statuses read:accounts read:statuses`, then copy *Your access token* (the two read scopes are for the "already announced?" check) |

Optional repository variable `MASTODON_INSTANCE` overrides the instance.
Without the secrets the step logs a warning and posts nothing.

## Manual run

Actions → *Build and deploy* → *Run workflow*: `slug` announces one existing
post (backfill), `dry_run` (default on) prints both payloads and still signs in
with the configured tokens - it checks the credentials and the duplicate guard,
it just does not publish.
The same check locally:

```
python3 .github/scripts/syndicate.py --slug websub-static-blog --dry-run
python3 .github/scripts/test_syndicate.py        # both networks against a local mock
```

`test_syndicate.py` runs the crossposter twice against fake PDS and Mastodon
servers: the first run must publish, the second must find both posts already
there. Nothing reaches the real accounts, and no tokens are needed.

# License

The following directories and their contents are Copyright Denis Evsyukov. You may not reuse anything therein without my permission:

* `content/posts/`

All other directories and files are MIT Licensed. Feel free to use the HTML and CSS as you please. If you do use them, a link back to [www.juev.org](https://www.juev.org) would be appreciated, but is not required.
