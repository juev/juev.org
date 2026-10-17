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
            assert 0 < len(record["text"]) <= 300, len(record["text"])
            assert record["langs"] == ["ru"], record
            for facet in record.get("facets", []):
                index = facet["index"]
                text = record["text"].encode()[index["byteStart"]:index["byteEnd"]].decode()
                feature = facet["features"][0]
                if feature["$type"].endswith("#link"):
                    assert text == feature["uri"], (text, feature)
                else:
                    assert text == "#" + feature["tag"], (text, feature)
            if record.get("embed"):
                assert record["embed"]["$type"] == "app.bsky.embed.external", record["embed"]
                assert record["embed"]["external"]["uri"], record["embed"]
            key = (body["collection"], body["rkey"])
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

    ok = (len(state["records"]) == 1 and len(state["statuses"]) == 1)
    print(f"\nbluesky records: {len(state['records'])}, mastodon statuses: {len(state['statuses'])}, "
          f"blobs: {state['blobs']}")
    if os.path.exists(summary):
        os.remove(summary)
    print("OK" if ok else "FAILED: expected exactly one post per network after two runs")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
