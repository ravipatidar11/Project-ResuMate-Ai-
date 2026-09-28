"""Small authenticated localhost gateway for Ollama when using a Cloudflare Tunnel."""

import hmac
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

OLLAMA_URL = os.environ.get("OLLAMA_LOCAL_URL", "http://127.0.0.1:11434").rstrip("/")
PROXY_TOKEN = os.environ.get("OLLAMA_PROXY_TOKEN", "")
LISTEN_HOST = "127.0.0.1"
LISTEN_PORT = int(os.environ.get("OLLAMA_PROXY_PORT", "11435"))
MAX_BODY_BYTES = 2 * 1024 * 1024


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            self._respond(200, b"Ollama auth proxy ready", "text/plain")
            return
        self._proxy()

    def do_POST(self):
        self._proxy()

    def _proxy(self):
        if not PROXY_TOKEN:
            self._respond(503, b"OLLAMA_PROXY_TOKEN is not configured")
            return
        supplied = self.headers.get("Authorization", "")
        expected = f"Bearer {PROXY_TOKEN}"
        if not hmac.compare_digest(supplied, expected):
            self._respond(401, b"Unauthorized")
            return
        if self.path not in ("/api/tags", "/api/generate"):
            self._respond(404, b"Not found")
            return

        body = None
        if self.command == "POST":
            try:
                length = int(self.headers.get("Content-Length", "0"))
            except ValueError:
                self._respond(400, b"Invalid Content-Length")
                return
            if length < 0 or length > MAX_BODY_BYTES:
                self._respond(413, b"Request body too large")
                return
            body = self.rfile.read(length)

        headers = {}
        content_type = self.headers.get("Content-Type")
        if content_type:
            headers["Content-Type"] = content_type
        request = Request(f"{OLLAMA_URL}{self.path}", data=body, headers=headers, method=self.command)
        try:
            with urlopen(request, timeout=660) as response:
                self._respond(response.status, response.read(), response.headers.get("Content-Type", "application/json"))
        except HTTPError as error:
            self._respond(error.code, error.read(), error.headers.get("Content-Type", "application/json"))
        except (URLError, TimeoutError, OSError) as error:
            print(f"Ollama upstream request failed: {error}", flush=True)
            self._respond(502, b"Ollama is unavailable on this computer")

    def _respond(self, status, payload, content_type="text/plain"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, format_string, *args):
        # Never log headers or request bodies, which could contain secrets or resume text.
        print(f"{self.client_address[0]} {self.command} {self.path}", flush=True)


if __name__ == "__main__":
    if not PROXY_TOKEN:
        raise SystemExit("Set OLLAMA_PROXY_TOKEN to a long random secret before starting the proxy.")
    print(f"Authenticated Ollama proxy listening at http://{LISTEN_HOST}:{LISTEN_PORT}", flush=True)
    ThreadingHTTPServer((LISTEN_HOST, LISTEN_PORT), Handler).serve_forever()
