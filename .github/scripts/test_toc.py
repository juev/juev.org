#!/usr/bin/env python3
"""Build temporary posts and verify the responsive table of contents.

    python3 .github/scripts/test_toc.py

Uses the repository's Hugo layouts with isolated content and output. Set
HUGO_BIN to select the pinned Hugo executable.
"""

from collections import Counter
from html.parser import HTMLParser
import os
from pathlib import Path
import subprocess
import tempfile
import unittest


REPO = Path(__file__).resolve().parents[2]
HUGO = os.environ.get("HUGO_BIN", "hugo")


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.source = source
        self.ids = []
        self.headings = set()
        self.tocs = {"post-toc": set(), "TableOfContents-inline": set()}
        self._toc_stack = []
        self.inline_open = False
        self.inline_summary = ""
        self._capture_summary = False
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        element_id = attrs.get("id")
        if element_id:
            self.ids.append(element_id)
        if tag in ("h2", "h3") and element_id:
            self.headings.add(element_id)

        if tag in ("aside", "details"):
            if element_id == "post-toc":
                self._toc_stack.append("post-toc")
            elif "post-toc-inline" in attrs.get("class", "").split():
                self._toc_stack.append("TableOfContents-inline")
                self.inline_open = "open" in attrs
            else:
                self._toc_stack.append(None)
        elif tag == "nav":
            if element_id in self.tocs:
                self._toc_stack.append(element_id)
            else:
                self._toc_stack.append(None)
        elif tag == "a" and self._toc_stack:
            active = next((item for item in reversed(self._toc_stack) if item in self.tocs), None)
            href = attrs.get("href", "")
            if active and href.startswith("#"):
                self.tocs[active].add(href[1:])
        elif tag == "summary" and "TableOfContents-inline" in self._toc_stack:
            self._capture_summary = True

    def handle_data(self, data):
        if self._capture_summary:
            self.inline_summary += data

    def handle_endtag(self, tag):
        if tag == "summary":
            self._capture_summary = False

        if tag in ("aside", "details", "nav") and self._toc_stack:
            self._toc_stack.pop()


def post(slug, date, heading_count, words, *, setext=False, h3_count=0,
         tags=(), mermaid=False):
    headings = []
    if setext and heading_count:
        headings.extend(["Setext section", "---------------"])
        heading_count -= 1
    headings.extend(f"## Section {index}" for index in range(1, heading_count + 1))
    headings.extend(f"### Subsection {index}" for index in range(1, h3_count + 1))
    body = [" ".join(f"word{index}" for index in range(words))]
    if mermaid:
        body.extend(["```mermaid", "graph TD; A-->B;", "```"])
    front_matter = ["---", f'title: "TOC fixture {slug}"', f'slug: "{slug}"',
                    f'date: "{date}T12:00:00+0300"']
    if tags:
        front_matter.append("tags: [" + ", ".join(tags) + "]")
    front_matter.append("---")
    return "\n".join(front_matter + ["", "\n".join(headings), "", *body])


class TocBuildTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(prefix="juev-toc-test.")
        cls.root = Path(cls.tmp.name)
        cls.content = cls.root / "content"
        cls.posts = cls.content / "posts"
        cls.posts.mkdir(parents=True)
        cls.write_posts(home_is_long=True)
        cls.first_build = cls.build("first")
        cls.write_posts(home_is_long=False)
        cls.second_build = cls.build("second")

    @classmethod
    def tearDownClass(cls):
        cls.tmp.cleanup()

    @classmethod
    def write_posts(cls, *, home_is_long):
        fixtures = [
            post("eligible", "2026-01-10", 4, 900, setext=True,
                 h3_count=1, tags=("links",), mermaid=True),
            post("three-long", "2026-01-02", 3, 900),
            post("four-short", "2026-01-03", 4, 700),
            post("h3-does-not-count", "2026-01-04", 3, 900, h3_count=5),
        ]
        if not home_is_long:
            fixtures.append(post("home-short", "2026-02-01", 3, 700))
        for source in cls.posts.glob("*.md"):
            source.unlink()
        for fixture in fixtures:
            slug = fixture.split('slug: "', 1)[1].split('"', 1)[0]
            date = fixture.split('date: "', 1)[1].split("T", 1)[0]
            (cls.posts / f"{date}-{slug}.md").write_text(fixture, encoding="utf-8")

    @classmethod
    def build(cls, name):
        destination = cls.root / name / "public"
        config = cls.root / name / "hugo.toml"
        config.parent.mkdir(parents=True, exist_ok=True)
        config.write_text((REPO / "config.toml").read_text(encoding="utf-8"), encoding="utf-8")
        command = [HUGO, "--source", str(REPO), "--config", str(config),
                   "--contentDir", str(cls.content),
                   "--destination", str(destination), "--cacheDir", str(cls.root / "cache"),
                   "--baseURL", "http://127.0.0.1:1313/", "--quiet", "--noBuildLock"]
        env = {**os.environ, "HUGO_RESOURCEDIR": str(cls.root / name / "resources")}
        result = subprocess.run(command, env=env, text=True, capture_output=True)
        if result.returncode:
            raise RuntimeError(f"Hugo build failed:\n{result.stdout}{result.stderr}")
        return destination

    @classmethod
    def page(cls, build, slug):
        matches = [path for path in build.rglob("index.html") if path.parent.name == slug]
        if not matches:
            raise AssertionError(f"No built page for fixture {slug}")
        return Document(matches[0].read_text(encoding="utf-8"))

    def assert_toc(self, page, expected):
        duplicate_ids = [item for item, count in Counter(page.ids).items() if count > 1]
        self.assertEqual(duplicate_ids, [], "page IDs must remain unique")
        self.assertEqual(bool(page.tocs["post-toc"]), expected)
        self.assertEqual(bool(page.tocs["TableOfContents-inline"]), expected)
        if expected:
            for element_id in ("TableOfContents", "TableOfContents-inline"):
                self.assertEqual(Counter(page.ids)[element_id], 1)
            desktop = page.tocs["post-toc"]
            mobile = page.tocs["TableOfContents-inline"]
            self.assertEqual(desktop, mobile)
            self.assertTrue(desktop.issubset(page.headings))

    def test_threshold_and_heading_levels(self):
        eligible = self.page(self.first_build, "eligible")
        self.assert_toc(eligible, True)
        self.assertIn("5 минут чтения", eligible.source)
        self.assertFalse(eligible.inline_open)
        self.assertEqual(eligible.inline_summary.strip(), "В этой статье")
        self.assertIn('class="post weblinks"', eligible.source)

        three_long = self.page(self.first_build, "three-long")
        self.assert_toc(three_long, False)
        self.assertIn("5 минут чтения", three_long.source)

        four_short = self.page(self.first_build, "four-short")
        self.assert_toc(four_short, False)
        self.assertIn("4 минуты чтения", four_short.source)

        self.assert_toc(self.page(self.first_build, "h3-does-not-count"), False)

    def test_homepage_uses_the_latest_posts_toc_rules(self):
        for build, expected in ((self.first_build, True), (self.second_build, False)):
            homepage = Document((build / "index.html").read_text(encoding="utf-8"))
            self.assert_toc(homepage, expected)

    def test_homepage_preserves_weblinks_and_mermaid_output(self):
        homepage = (self.first_build / "index.html").read_text(encoding="utf-8")
        self.assertIn('class="post weblinks"', homepage)
        self.assertIn('<div class="mermaid">', homepage)
        self.assertIn("mermaid.esm.min.mjs", homepage)


if __name__ == "__main__":
    unittest.main()
