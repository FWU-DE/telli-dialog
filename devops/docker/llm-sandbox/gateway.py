"""Small authenticated HTTP gateway for one-shot LLM Sandbox executions."""
from __future__ import annotations

import hmac
import json
import os
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

MAX_SOURCE = 64 * 1024
MAX_OUTPUT = 64 * 1024
MAX_SECONDS = 10
MAX_CONCURRENT = 4
REQUEST_TIMEOUT_SECONDS = 15
LANGUAGES = {"python", "javascript", "typescript"}
IMAGES = {
    "python": os.getenv("SANDBOX_PYTHON_IMAGE", "python:3.12.10-slim-bookworm"),
    "javascript": os.getenv("SANDBOX_NODE_IMAGE", "node:22.14.0-bookworm-slim"),
    "typescript": os.getenv("SANDBOX_TYPESCRIPT_IMAGE", "ais-chat/llm-sandbox-typescript:1"),
}
TOKEN = os.environ.get("SANDBOX_GATEWAY_TOKEN", "")
SLOTS = threading.BoundedSemaphore(MAX_CONCURRENT)


def validate_payload(value: Any) -> tuple[str, str]:
    if not isinstance(value, dict) or set(value) != {"language", "source"}:
        raise ValueError("invalid request")
    language, source = value["language"], value["source"]
    if not isinstance(language, str) or language not in LANGUAGES:
        raise ValueError("invalid request")
    if not isinstance(source, str) or not source or len(source.encode()) > MAX_SOURCE:
        raise ValueError("invalid request")
    return language, source


def execute(language: str, source: str) -> dict[str, Any]:
    """Execute through llm-sandbox; imports stay lazy so validation tests need no Docker."""
    from llm_sandbox import SandboxSession
    from llm_sandbox.exceptions import SandboxTimeoutError

    code = source
    if language == "typescript":
        # Execute through the pinned tsx binary without shell interpolation.
        code = ("const r=require('node:child_process').spawnSync('tsx',['-e',"
                 + json.dumps(source) + "],{stdio:'inherit'});"
                 "process.exit(r.status===null?124:r.status);")
    runtime = {
        "network_mode": "none", "mem_limit": "256m", "nano_cpus": 1_000_000_000,
        "pids_limit": 64, "cap_drop": ["ALL"], "cap_add": ["DAC_OVERRIDE"],
        "security_opt": ["no-new-privileges:true"],
        "tmpfs": {"/tmp": "rw,noexec,nosuid,size=16m"},
    }
    session = SandboxSession(
        lang="javascript" if language in {"javascript", "typescript"} else language,
        image=IMAGES[language],
        keep_template=False,
        skip_environment_setup=True,
        runtime_configs=runtime,
    )
    container = None
    try:
        with session:
            container = session.container
            result = session.run(code, timeout=MAX_SECONDS)
    except SandboxTimeoutError:
        return {"exitCode": 124, "stdout": "", "stderr": "execution timed out", "timedOut": True}
    finally:
        if container is not None:
            try:
                container.remove(force=True)
            except Exception:
                pass
    stdout = bounded_text(result.stdout, MAX_OUTPUT)
    remaining = max(0, MAX_OUTPUT - len(stdout.encode("utf-8")))
    stderr = bounded_text(result.stderr, remaining)
    return {"exitCode": result.exit_code, "stdout": stdout, "stderr": stderr,
            "timedOut": bool(getattr(result, "timed_out", False))}


def bounded_text(value: Any, budget: int) -> str:
    return str(value or "").encode("utf-8")[:budget].decode("utf-8", "replace")


def docker_ready() -> bool:
    try:
        import docker
        client = docker.from_env()
        client.ping()
        for image in IMAGES.values():
            client.images.get(image)
        return True
    except Exception:
        return False


class Handler(BaseHTTPRequestHandler):
    server_version = "llm-sandbox-gateway/1"

    def log_message(self, *_args: Any) -> None:
        return

    def send_json(self, status: int, body: dict[str, Any]) -> None:
        encoded = json.dumps(body).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self.send_json(200, {"status": "ok"})
        elif self.path == "/ready":
            ready = docker_ready()
            self.send_json(200 if ready else 503, {"status": "ok" if ready else "not ready"})
        else:
            self.send_json(404, {"error": "not found"})

    def do_POST(self) -> None:  # noqa: N802
        self.connection.settimeout(REQUEST_TIMEOUT_SECONDS)
        if self.path != "/v1/execute":
            self.send_json(404, {"error": "not found"}); return
        auth = self.headers.get("Authorization", "")
        if not TOKEN or not hmac.compare_digest(auth, f"Bearer {TOKEN}"):
            self.send_json(401, {"error": "unauthorized"}); return
        try:
            length = int(self.headers.get("Content-Length", "-1"))
            if length < 0 or length > MAX_SOURCE + 1024:
                raise ValueError("invalid request")
            language, source = validate_payload(json.loads(self.rfile.read(length)))
        except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
            self.send_json(400, {"error": "invalid request"}); return
        if not SLOTS.acquire(blocking=False):
            self.send_json(429, {"error": "busy"}); return
        started_at = time.monotonic()
        try:
            result = execute(language, source)
            print(
                json.dumps(
                    {
                        "event": "execution_completed",
                        "language": language,
                        "exitCode": result["exitCode"],
                        "timedOut": result["timedOut"],
                        "durationMs": round((time.monotonic() - started_at) * 1000),
                    }
                ),
                flush=True,
            )
            self.send_json(200, result)
        except Exception:  # never expose Docker, source, or runtime details
            print(
                json.dumps(
                    {
                        "event": "execution_failed",
                        "language": language,
                        "durationMs": round((time.monotonic() - started_at) * 1000),
                    }
                ),
                flush=True,
            )
            self.send_json(500, {"error": "execution failed"})
        finally:
            SLOTS.release()


def main() -> None:
    if not TOKEN:
        raise RuntimeError("SANDBOX_GATEWAY_TOKEN is required")
    ThreadingHTTPServer(("0.0.0.0", int(os.getenv("PORT", "8080"))), Handler).serve_forever()


if __name__ == "__main__":
    main()
