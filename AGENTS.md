# juev.org

Personal site and blog. Hugo (extended, the exact version is pinned in
`.github/workflows/hugo.yaml` — currently 0.167.0), Russian content,
GitHub Pages, live at https://www.juev.org.

Posts are one file each: `content/posts/YYYY-MM-DD-<slug>.markdown`.
Publishing = merge to `master`; that builds the site, deploys it, and runs
the syndication job.

## Writing a post

- Read the two or three newest files in `content/posts/` before drafting —
  they are the style spec, not generic blog advice: Russian, first person,
  technical, no marketing tone, no emoji headings, sections as plain
  `##` / `###`.
- Front matter: `title` (Russian, quoted), `slug` (ASCII kebab-case, matching
  the file name after the date), `date: YYYY-MM-DDTHH:MM:SS+0300`, `tags`
  (lowercase, one-word English), optional `image`.
- Sources as footnotes: inline `[^name]` plus definitions at the bottom,
  `[^name]: [текст](url), комментарий.` A definition with no inline reference
  is dropped without a warning.
- No invented facts. Numbers, dates, ids and model names come from `git log`,
  CI logs, a live `curl` of the deployed page, or the service's own state.

## Images

- Post images live in a separate repository, `juev/static.juev.org`
  (local clone `~/src/github.com/juev/static.juev.org`), under
  `public/YYYY/MM/<slug>-<name>.png`, and are served as
  `https://static.juev.org/YYYY/MM/<slug>-<name>.png`.
- A push to its `master` deploys them through GitHub Pages; there are no
  PRs in that repository. Push the images right before merging the post,
  not earlier, and check that the URLs answer 200.

## Verify with a real build

- Build with the pinned Hugo, not whatever is on `PATH`: take
  `hugo_extended_<version>_linux-amd64.tar.gz` from the Hugo releases, run it
  from a scratch directory against the working tree, output to scratch.
- On macOS that archive does not run, and the release has no darwin archive,
  only `hugo_extended_<version>_darwin-universal.pkg`. Unpack it with
  `pkgutil --expand-full <pkg> <dir>` and run `<dir>/Payload/hugo`.
- To open the build in a local browser, pass
  `--baseURL http://127.0.0.1:<port>/`. Scripts and styles use absolute
  URLs, so without it the page loads them from the live site, not from
  the build.
- Check the artifact, not the markdown: the page exists at
  `<build>/YYYY/MM/DD/<slug>/index.html`, the slug appears in `atom.xml` and
  `sitemap.xml`, and the counts of `footnote-ref`, `<table`, `<pre` match what
  the source contains.
- A post whose `date:` is in the future is skipped silently. While verifying,
  keep the timestamp a few minutes in the past.

## Git

- Work on a branch in a separate worktree, never on `master`:
  `git worktree add -b <branch> ../.worktrees/juev.org-<topic> origin/master`.
- Never push `master`. Open a PR; merging it is the owner's decision and is
  the publish action.
- Commits: `Denis Evsyukov <denis@evsyukov.org>`, message in the repo's style —
  `feat: add <slug>`, `docs(post): ...`, `fix: ...`.

## Syndication

`.github/scripts/syndicate.py` runs after a successful deploy and announces
posts that were **added** under `content/posts/` on Bluesky and Mastodon
(`infosec.exchange`). It checks both accounts for an existing link before
posting, so reruns do not duplicate. `syndicate: false` in a post's front
matter opts that post out; `draft: true` skips it too.

## Layout notes

- Layouts, SCSS and scripts are local — there is no theme submodule, a plain
  Hugo build works.
- `enableGitInfo` is on; `permalinks.posts = "/:year/:month/:day/:slug/"`.
- Inline code renders with visible backticks by design (`content: "\`"` in
  `assets/scss/_style.scss`) — that is house style, not broken markup.
