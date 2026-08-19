#!/bin/sh
set -eu

base_url=${1:-http://127.0.0.1:8001}
export BASE_URL=${base_url%/}

python3 - <<'PY'
import json
import os
import urllib.request

base = os.environ['BASE_URL']

def call(code, language, timeout=15, expect_success=True, memory_limit=128):
    body = json.dumps({
        'language': language,
        'code': code,
        'stdin': '',
        'compile_timeout': 5,
        'run_timeout': 5,
        'memory_limit_MB': memory_limit,
        'max_output_chars': 2000,
    }).encode()
    req = urllib.request.Request(base + '/run_code', body, {'content-type': 'application/json'})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        result = json.load(response)
    if expect_success and result.get('status') != 'Success':
        raise AssertionError(result)
    return result

def output(result):
    run_result = result.get('run_result') or {}
    return (run_result.get('stdout') or '') + (run_result.get('stderr') or '')

def result_status(result):
    return str(result.get('run_result', {}).get('status', ''))

with urllib.request.urlopen(base + '/v1/ping', timeout=5) as response:
    assert response.read().decode() == '"pong"', response.status

for language, code, expected in [
    ('python', 'print("sandbox-python")', 'sandbox-python'),
    ('nodejs', 'console.log("sandbox-nodejs")', 'sandbox-nodejs'),
    ('typescript', 'console.log("sandbox-typescript")', 'sandbox-typescript'),
]:
    assert expected in output(call(code, language)), language

eof = call('import sys\nprint("EOF" if sys.stdin.read() == "" else "INPUT")', 'python')
if 'EOF' not in output(eof) or 'INPUT' in output(eof):
    raise AssertionError(('stdin was not empty', eof))

timed_out = call('while True: pass', 'python', timeout=15, expect_success=False)
if result_status(timed_out) not in {'TimeLimitExceeded', 'TimeLimitExceededError'} and \
        'time limit' not in output(timed_out).lower():
    raise AssertionError(('timeout was not enforced', timed_out))

network = call(
    'import urllib.request\n'
    'try:\n'
    '    urllib.request.urlopen("https://example.com", timeout=2)\n'
    '    print("NETWORK_ENABLED")\n'
    'except Exception:\n'
    '    print("NETWORK_BLOCKED")',
    'python',
)
network_output = output(network)
if 'NETWORK_BLOCKED' not in network_output or 'NETWORK_ENABLED' in network_output:
    raise AssertionError(('network policy was not demonstrated', network))

oversized = call(
    'import sys\n'
    'sys.stdout.write("o" * 5000)\n'
    'sys.stderr.write("e" * 5000)\n',
    'python', expect_success=False,
)
if len(output(oversized).encode()) > 2000 or result_status(oversized) != 'OutputLimitExceeded':
    raise AssertionError(('combined output limit was not enforced', oversized))

flood = call('import sys, time\nsys.stdout.write("o" * 5000)\nsys.stdout.flush()\ntime.sleep(60)',
             'python', timeout=10, expect_success=False)
if result_status(flood) != 'OutputLimitExceeded' or len(output(flood).encode()) > 2000:
    raise AssertionError(('output flood was not terminated promptly', flood))

early_eof = call(
    'import os, sys, time\n'
    'os.close(sys.stdout.fileno())\n'
    'time.sleep(0.2)\n'
    'sys.stderr.write("EARLY_EOF_MARKER")\n',
    'python',
)
if 'EARLY_EOF_MARKER' not in output(early_eof):
    raise AssertionError(('stdout EOF incorrectly terminated the process', early_eof))

memory = call(
    'print("MEMORY_LIMIT_BYPASSED")',
    'python', expect_success=False, memory_limit=1,
)
if 'MEMORY_LIMIT_BYPASSED' in output(memory):
    raise AssertionError(('memory limit was not enforced', memory))

print('SandboxFusion smoke passed: ping, python/nodejs/typescript, timeout, network denial, output, memory limits')
PY
