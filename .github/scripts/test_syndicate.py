#!/usr/bin/env python3
"""Self-test for syndicate.py: fake PDS + Mastodon, real post from content/posts.

    python3 .github/scripts/test_syndicate.py [slug]

Starts local servers that speak just enough of both APIs, runs the crossposter
twice and checks that the first run publishes and the second run is a no-op.
Nothing is sent to the real networks; the only outside request is the GET of
the published page and sitemap on the live site.
"""

import json
import os
import re
import subprocess
import sys
import threading
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
SCRIPT = os.path.join(HERE, "syndicate.py")

state = {"records": {}, "statuses": [], "blobs": []}

# A TID is 13 characters of the base32-sortable alphabet.
ALPHABET = "234567abcdefghijklmnopqrstuvwxyz"
TID = rf"[{ALPHABET}]{{13}}"


def tid(n: int) -> str:
    """A valid-looking TID for the mock, so the fake repo obeys the same rule."""
    return "3l" + "".join(ALPHABET[(n >> (5 * i)) & 31] for i in range(10, -1, -1))


def newest_slug() -> str:
    posts = [p for p in os.listdir(os.path.join(REPO, "content", "posts"))
             if re.match(r"^\d{4}-\d{2}-\d{2}-.+\.(markdown|md)$", p)]
    name = sorted(posts)[-1]
    return re.sub(r"^\d{4}-\d{2}-\d{2}-|\.(markdown|md)$", "", name)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def _send(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(url.query)
        if url.path == "/xrpc/com.atproto.repo.getRecord":
            key = (query.get("collection", [""])[0], query.get("rkey", [""])[0])
            if key in state["records"]:
                return self._send(200, {"cid": "bafytest", "value": state["records"][key]})
            return self._send(400, {"error": "RecordNotFound", "message": "no such record"})
        if url.path == "/api/v1/accounts/verify_credentials":
            if self.headers.get("Authorization") != "Bearer mastodon-token":
                return self._send(401, {"error": "The access token is invalid"})
            return self._send(200, {"id": "42", "acct": "juev", "username": "juev"})
        if url.path == "/xrpc/app.bsky.feed.getAuthorFeed":
            feed = [{"post": {"uri": f"at://did:plc:test/app.bsky.feed.post/{rkey}",
                              "author": {"did": "did:plc:test"},
                              "record": record,
                              "embed": {"$type": "app.bsky.embed.external#view",
                                        "external": record["embed"]["external"]}}}
                    for (collection, rkey), record in state["records"].items()
                    if collection == "app.bsky.feed.post"]
            return self._send(200, {"feed": feed[::-1]})
        if url.path == "/api/v1/accounts/42/statuses":
            return self._send(200, state["statuses"][-40:][::-1])
        return self._send(404, {"error": "not found"})

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        raw = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        if url.path == "/xrpc/com.atproto.server.createSession":
            body = json.loads(raw)
            assert body["identifier"] == "juev.bsky.social", body
            assert body["password"] == "app-password", body
            return self._send(200, {"accessJwt": "jwt", "did": "did:plc:test",
                                    "handle": "juev.bsky.social"})
        if url.path.startswith("/xrpc/") and self.headers.get("Authorization") != "Bearer jwt":
            return self._send(401, {"error": "AuthMissing", "message": "Authentication Required"})
        if url.path == "/xrpc/com.atproto.repo.createRecord":
            body = json.loads(raw)
            record = body["record"]
            assert record["$type"] == "app.bsky.feed.post", record
            # The shape the account publishes by hand: title only, no URL in the
            # text, no facets, one link card.
            assert 0 < len(record["text"]) <= 300, len(record["text"])
            assert "http" not in record["text"], record["text"]
            assert "facets" not in record, record
            assert record["langs"] == ["ru"], record
            assert record["embed"]["$type"] == "app.bsky.embed.external", record["embed"]
            external = record["embed"]["external"]
            assert external["uri"].startswith("https://www.juev.org/"), external
            assert external["title"], external
            # `app.bsky.feed.post` uses the `tid` record key type: the PDS rejects
            # anything else and generates a TID when no key is supplied. The real
            # run failed exactly here, so the mock has to enforce it too.
            rkey = body.get("rkey")
            if rkey is not None and not re.fullmatch(TID, rkey):
                return self._send(400, {"error": "InvalidRequest",
                                        "message": "Invalid record key for app.bsky.feed.post: "
                                                   f'Invalid TID string (got "{rkey}") at $'})
            if rkey is None:
                rkey = tid(len(state["records"]) + 1)
            key = (body["collection"], rkey)
            if key in state["records"]:
                return self._send(400, {"error": "InvalidRequest", "message": "already exists"})
            state["records"][key] = record
            return self._send(200, {"uri": f"at://did:plc:test/{key[0]}/{key[1]}",
                                    "cid": "bafynew"})
        if url.path == "/xrpc/com.atproto.repo.uploadBlob":
            ctype = self.headers.get("Content-Type")
            state["blobs"].append({"type": ctype, "size": len(raw)})
            return self._send(200, {"blob": {"$type": "blob", "ref": {"$link": "bafyblob"},
                                             "mimeType": ctype, "size": len(raw)}})
        if url.path == "/api/v1/statuses":
            if self.headers.get("Authorization") != "Bearer mastodon-token":
                return self._send(401, {"error": "The access token is invalid"})
            assert self.headers.get("Idempotency-Key"), "idempotency key missing"
            form = urllib.parse.parse_qs(raw.decode())
            assert form["visibility"][0] == "public" and form["language"][0] == "ru", form
            # `title URL` on one line, like the rest of the timeline
            assert "\n" not in form["status"][0] and "http" in form["status"][0], form["status"]
            entry = {"id": str(len(state["statuses"]) + 1), "url": "https://example.invalid/@juev/1",
                     "content": f"<p>{form['status'][0]}</p>"}
            state["statuses"].append(entry)
            return self._send(200, entry)
        return self._send(404, {"error": "not found"})


def main() -> int:
    slug = sys.argv[1] if len(sys.argv) > 1 else newest_slug()
    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_address[1]}"
    env = dict(os.environ,
               BSKY_HANDLE="juev.bsky.social",
               BSKY_APP_PASSWORD="app-password",
               BSKY_PDS=f"{base}/xrpc",
               MASTODON_INSTANCE=base,
               MASTODON_TOKEN="mastodon-token")
    summary = os.path.join(REPO, ".syndicate-test-summary.md")
    env["GITHUB_STEP_SUMMARY"] = summary

    for run in (1, 2):
        print(f"--- run {run} (slug: {slug})")
        proc = subprocess.run([sys.executable, SCRIPT, "--slug", slug], env=env,
                              capture_output=True, text=True, cwd=REPO)
        print(proc.stdout + proc.stderr, end="")
        if proc.returncode != 0:
            print("FAILED")
            return 1

    keys = [rkey for (_, rkey) in state["records"]]
    ok = (len(state["records"]) == 1 and len(state["statuses"]) == 1
          and all(re.fullmatch(TID, k) for k in keys))
    print(f"\nbluesky records: {len(state['records'])}, mastodon statuses: {len(state['statuses'])}, "
          f"blobs: {state['blobs']}")
    if os.path.exists(summary):
        os.remove(summary)
    print("OK" if ok else "FAILED: expected exactly one post per network after two runs")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
