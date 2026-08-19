#!/bin/sh
set -eu

config=/root/sandbox/sandbox/configs/local.yaml
source=/root/sandbox/sandbox/runners/base.py
types=/root/sandbox/sandbox/runners/types.py
isolation=/root/sandbox/sandbox/runners/isolation.py
api=/root/sandbox/sandbox/server/sandbox_api.py

grep -Fqx '  isolation: none' "$config" || { echo "unexpected SandboxFusion config" >&2; exit 1; }
grep -Fq "kwargs.get('netns_no_bridge', False)" "$source" || { echo "unexpected runner" >&2; exit 1; }
grep -Fq "async def tmp_cgroup" "$isolation" || { echo "unexpected isolation module" >&2; exit 1; }
grep -Fq 'run_timeout: float = 10' "$types" || { echo "unexpected request model" >&2; exit 1; }
grep -Fq 'class RunCodeRequest(BaseModel):' "$api" || { echo "unexpected sandbox API" >&2; exit 1; }

sed -i 's/^  isolation: none$/  isolation: lite/' "$config"
sed -i "s/kwargs.get('netns_no_bridge', False)/True/" "$source"
python3 - "$source" "$types" "$isolation" "$api" <<'PY'
import glob, pathlib, sys
source, types, isolation, api = sys.argv[1:]
p = pathlib.Path(source); s = p.read_text()
old = "from sandbox.runners.isolation import tmp_cgroup, tmp_netns, tmp_overlayfs"
assert s.count(old) == 1 and s.count("prefix += ['cgexec', '-g', cg]") == 1
s = s.replace(old, "from sandbox.runners.isolation import tmp_netns, tmp_overlayfs\nfrom sandbox_cgroup_v2 import tmp_cgroup")
s = s.replace("async with tmp_overlayfs() as root, tmp_cgroup(mem_limit='4G', cpu_limit=1) as cgroups, tmp_netns(\n                True) as netns:", "async with tmp_overlayfs() as root, tmp_cgroup(mem_limit=args.memory_limit_MB, cpu_limit=1) as cgroup, tmp_netns(\n                True) as netns:")
s = s.replace("            prefix = []\n            for cg in cgroups:\n                prefix += ['cgexec', '-g', cg]\n", "            prefix = []\n            def join_cgroup():\n                from sandbox_cgroup_v2 import _join\n                _join(cgroup)\n")
s = s.replace("extra_env, True)\n", "extra_env, True, preexec_fn=join_cgroup)\n")
assert "cgexec" not in s and "args.memory_limit_MB" in s and s.count("preexec_fn=join_cgroup") == 2

# Replace the vendor's post-wait unbounded capture.  This exact anchor is
# intentionally tied to the pinned source above; an upstream change fails the
# image build rather than silently restoring the old 1 MiB-per-stream cap.
import re
start = s.index("async def run_command_bare(")
end = s.index("\n\nasync def run_commands", start)
replacement = '''async def run_command_bare(command: str | List[str],
                           timeout: float = 10,
                           stdin: Optional[str] = None,
                           cwd: Optional[str] = None,
                           extra_env: Optional[Dict[str, str]] = {},
                           use_exec: bool = False,
                           preexec_fn=None,
                           max_output_chars: int = 65536) -> CommandRunResult:
    try:
        logger.debug(f'running command {command}')
        create = asyncio.create_subprocess_exec if use_exec else asyncio.create_subprocess_shell
        if use_exec:
            p = await create(*command, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                             stderr=subprocess.PIPE, env={**os.environ, **(extra_env or {})},
                             preexec_fn=preexec_fn)
        else:
            p = await create(command, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                             stderr=subprocess.PIPE, cwd=cwd, executable='/bin/bash',
                             env={**os.environ, **(extra_env or {})}, preexec_fn=preexec_fn)
        if stdin is not None:
            p.stdin.write(stdin.encode())
        p.stdin.close()
        start_time = time.time()
        remaining = max_output_chars
        output_limited = asyncio.Event()
        budget_lock = asyncio.Lock()

        async def read_stream(stream):
            nonlocal remaining
            chunks = []
            while True:
                chunk = await stream.read(4096)
                if not chunk:
                    return b''.join(chunks).decode('utf-8', errors='replace')
                async with budget_lock:
                    allowed = min(len(chunk), remaining)
                    remaining -= allowed
                    exceeded = allowed < len(chunk)
                chunks.append(chunk[:allowed])
                if exceeded:
                    output_limited.set()
                    return b''.join(chunks).decode('utf-8', errors='replace')

        readers = [asyncio.create_task(read_stream(p.stdout)), asyncio.create_task(read_stream(p.stderr))]
        wait_task = asyncio.create_task(p.wait())
        status = CommandRunStatus.Finished
        overflow_task = asyncio.create_task(output_limited.wait())
        try:
            done, _ = await asyncio.wait([wait_task, overflow_task], timeout=timeout,
                                         return_when=asyncio.FIRST_COMPLETED)
            if overflow_task in done or output_limited.is_set():
                status = CommandRunStatus.OutputLimitExceeded
                if p.returncode is None:
                    kill_process_tree(p.pid)
                await wait_task
            elif wait_task in done:
                await wait_task
            else:
                status = CommandRunStatus.TimeLimitExceeded
                kill_process_tree(p.pid)
                await wait_task
            stdout, stderr = await asyncio.gather(*readers)
            if output_limited.is_set() and status == CommandRunStatus.Finished:
                status = CommandRunStatus.OutputLimitExceeded
        finally:
            overflow_task.cancel()
            for reader in readers:
                if not reader.done():
                    reader.cancel()
            await asyncio.gather(overflow_task, return_exceptions=True)
            await asyncio.gather(*readers, return_exceptions=True)
            if not wait_task.done():
                kill_process_tree(p.pid)
                await wait_task
        return CommandRunResult(status=status, execution_time=time.time() - start_time,
                                return_code=p.returncode, stdout=stdout, stderr=stderr)
    except Exception as e:
        message = f'exception on running command {command}: {e} | {traceback.print_tb(e.__traceback__)}'
        logger.warning(message)
        return CommandRunResult(status=CommandRunStatus.Error, stderr=message)
'''
s = s[:start] + replacement + s[end:]
assert s.count("max_output_chars: int = 65536") == 1
# A single budget spans compile and run; the second producer receives the remainder.
s = s.replace("    files = {}\n    compile_res = None", "    files = {}\n    remaining_output = args.max_output_chars\n    compile_res = None")
s = s.replace("extra_env,\n                                                 preexec_fn=preexec_fn)", "extra_env,\n                                                 preexec_fn=preexec_fn,\n                                                 max_output_chars=remaining_output)")
s = s.replace("extra_env, True, preexec_fn=join_cgroup)\n", "extra_env, True, preexec_fn=join_cgroup, max_output_chars=remaining_output)\n")
s = s.replace("        if compile_res is None or (compile_res.status == CommandRunStatus.Finished and compile_res.return_code == 0):", "        if compile_res is not None:\n            remaining_output = max(0, remaining_output - len((compile_res.stdout or '').encode()) - len((compile_res.stderr or '').encode()))\n        if compile_res is None or (compile_res.status == CommandRunStatus.Finished and compile_res.return_code == 0):")
p.write_text(s)

p = pathlib.Path(types); s = p.read_text()
needle = "    run_timeout: float = 10\n"
assert s.count(needle) == 1
p.write_text(s.replace(needle, needle + "    memory_limit_MB: int = 128\n"))

p = pathlib.Path(types); s = p.read_text()
s = s.replace("    TimeLimitExceeded = 'TimeLimitExceeded'", "    TimeLimitExceeded = 'TimeLimitExceeded'\n    OutputLimitExceeded = 'OutputLimitExceeded'")
s = s.replace("    fetch_files: List[str] = []\n", "    fetch_files: List[str] = []\n    max_output_chars: int = Field(65536, ge=1, le=65536)\n", 1)
p.write_text(s)

p = pathlib.Path(api); s = p.read_text()
needle = "    fetch_files: List[str] = Field([], description='a list of file paths to fetch after code execution')"
assert s.count(needle) == 1
s = s.replace(
    needle,
    needle
    + "\n    max_output_chars: int = Field(65536, ge=1, le=65536)"
    + "\n    memory_limit_MB: int = Field(128, ge=1, le=128)",
)
s = s.replace("    SandboxError = 'SandboxError'", "    SandboxError = 'SandboxError'\n    OutputLimitExceeded = 'OutputLimitExceeded'")
needle = "        if o == CommandRunStatus.Error:\n            return RunStatus.SandboxError, m"
assert s.count(needle) == 1
s = s.replace(needle, needle + "\n        if o == CommandRunStatus.OutputLimitExceeded:\n            return RunStatus.OutputLimitExceeded, 'combined stdout/stderr output limit exceeded'")
p.write_text(s)

# Disable the old v1 implementation while retaining upstream overlay/netns code.
p = pathlib.Path(isolation); s = p.read_text()
assert s.count("async def tmp_cgroup") == 1
start = s.index("@cached_context\n@asynccontextmanager\nasync def tmp_cgroup")
end = s.index("\n\navailable_subnets", start)
p.write_text(s[:start] + "\n\n" + s[end + 2:])
PY

grep -Fqx '  isolation: lite' "$config"
! grep -Fq cgexec "$source"
