"""Small, fail-closed cgroup v2 runner used by the pinned SandboxFusion image."""
import asyncio
import logging
import os
import sys
import time
import uuid
from contextlib import asynccontextmanager

ROOT = "/sys/fs/cgroup"
logger = logging.getLogger(__name__)

try:
    _BaseExceptionGroup = BaseExceptionGroup
except NameError:  # pragma: no cover - vendor image currently runs Python 3.10
    class _BaseExceptionGroup(BaseException):
        def __init__(self, message, exceptions):
            super().__init__(message)
            self.exceptions = tuple(exceptions)


def _write(path, value):
    with open(path, "w", encoding="ascii") as stream:
        stream.write(value)


def _create(memory_mb, cpu_limit):
    if not os.path.isfile(os.path.join(ROOT, "cgroup.controllers")):
        raise RuntimeError("SandboxFusion requires a cgroup v2 hierarchy")
    name = os.path.join(ROOT, "sandbox-fusion-" + uuid.uuid4().hex)
    os.mkdir(name)
    try:
        available = set(open(os.path.join(ROOT, "cgroup.controllers"), encoding="ascii").read().split())
        wanted = {"memory", "cpu"}
        if not wanted.issubset(available):
            raise RuntimeError("required cgroup v2 controllers are unavailable")
        enabled = set(open(os.path.join(ROOT, "cgroup.subtree_control"), encoding="ascii").read().split())
        if not {"memory", "cpu"}.issubset(enabled):
            raise RuntimeError("cgroup v2 controllers are not delegated")
        child_available = set(open(os.path.join(name, "cgroup.controllers"), encoding="ascii").read().split())
        if not wanted.issubset(child_available):
            raise RuntimeError("required cgroup v2 controllers were not delegated")
        if not isinstance(memory_mb, int) or not 1 <= memory_mb <= 128:
            raise ValueError("memory_limit_MB must be an integer from 1 through 128")
        _write(os.path.join(name, "memory.max"), str(memory_mb * 1024 * 1024))
        # One CPU, with a finite quota, avoids inheriting an unlimited host quota.
        _write(os.path.join(name, "cpu.max"), "100000 100000" if cpu_limit else "100000 100000")
        return name
    except Exception:
        try:
            os.rmdir(name)
        except OSError:
            logger.exception("failed to remove incomplete cgroup %s", name)
        raise


def _join(path):
    with open(os.path.join(path, "cgroup.procs"), "w", encoding="ascii") as stream:
        stream.write(str(os.getpid()))


def _kill_and_remove(path):
    kill_file = os.path.join(path, "cgroup.kill")
    if not os.path.isfile(kill_file):
        raise RuntimeError("cgroup.kill is required by the cgroup v2 contract")
    _write(kill_file, "1")
    events = os.path.join(path, "cgroup.events")
    procs = os.path.join(path, "cgroup.procs")
    for _ in range(50):
        with open(events, encoding="ascii") as stream:
            populated = next((line.split()[1] for line in stream if line.startswith("populated ")), None)
        with open(procs, encoding="ascii") as stream:
            has_processes = bool(stream.read().split())
        if populated == "0" and not has_processes:
            break
        time.sleep(0.02)
    else:
        raise RuntimeError("processes remained in cgroup after cgroup.kill")
    try:
        os.rmdir(path)
    except OSError as error:
        raise RuntimeError(f"failed to remove cgroup {path}: {error}") from error


@asynccontextmanager
async def tmp_cgroup(mem_limit=None, cpu_limit=1):
    if mem_limit is None:
        raise RuntimeError("a finite memory limit is required")
    memory_mb = int(str(mem_limit).rstrip("M"))
    path = await asyncio.to_thread(_create, memory_mb, cpu_limit)
    try:
        yield path
    except BaseException as body_error:
        try:
            await asyncio.to_thread(_kill_and_remove, path)
        except BaseException as cleanup_error:
            raise _BaseExceptionGroup(
                "sandbox body and cgroup cleanup failed",
                [body_error, cleanup_error],
            ) from cleanup_error
        raise
    else:
        # Cleanup failures are intentionally not swallowed on the success path.
        await asyncio.to_thread(_kill_and_remove, path)
