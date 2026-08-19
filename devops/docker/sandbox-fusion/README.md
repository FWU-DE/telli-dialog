# SandboxFusion deployment

The compose files pin the official `volcengine/sandbox-fusion:server-20250609`
image to the amd64 image digest
`sha256:dd7ff53d16132a8acad6d5da7f15154bb4a331381567a4cb21b3e97ce581f5f9`.

Compose builds a repository-owned image from that digest. The build changes
the upstream-supported `isolation: none` configuration to `isolation: lite`
and forces its network namespace invocation to use `--no-bridge`. Each
program therefore gets a fresh namespace with only loopback, while the API
remains reachable on port 8080. Python, Node.js, and TypeScript are provided
by the official image.

Every request must send `compile_timeout=5`, `run_timeout=5`, and
`memory_limit_MB=128`; `max_output_chars` defaults to 65536 and is validated
between 1 and 65536. These are actual upstream request fields, not invented
environment variables.

The patch requires cgroup v2 and a writable delegated hierarchy. The compose
service uses `cgroup: private` (Docker Engine 27+); do not run this image with
`isolation: none`. Each request gets a unique child cgroup with `memory.max`
set to the validated request value (1–128 MiB) and `cpu.max` set to one full
CPU. The child is killed and removed, including descendants, on every exit.

The application sends no input files; this is an application policy, not a
claim that the runtime cannot write its own isolated temporary working files.
stdout and stderr are read concurrently under one combined byte budget while
the process runs. Exceeding that budget terminates the process tree and returns
the distinct `OutputLimitExceeded` status with safely decoded output retained.
The direct smoke test does not separately assert compile-timeout behavior:
compile-timeout execution is not deterministic for the supported TypeScript
path. The run-timeout, output, memory, empty-stdin, and network checks are
covered instead.

The gateway is bound to loopback (`127.0.0.1:8001`) and is therefore not
publicly exposed. Source-development clients on the host should use
`http://127.0.0.1:8001`; local-compose containers should use
`http://sandbox-fusion:8080`. The self-hosted application shares Keycloak's
network namespace and uses the service DNS `http://sandbox-fusion:8080`.

## Limitations

Upstream `lite` isolation requires mount, cgroup, and network-namespace
operations, so the compose service uses `privileged: true`. This is a
significant limitation: run it only on a dedicated trusted Docker host. No
Docker socket or application secrets are mounted. Re-review the patch when
upgrading the vendor image.

## Direct smoke test

Start only the gateway (the first build downloads the large pinned vendor
image), then run the deterministic checks without an LLM:

```sh
docker compose -f devops/docker/docker-compose.local.yml up -d sandbox-fusion
devops/docker/sandbox-fusion/smoke.sh http://127.0.0.1:8001
```

The smoke test checks `/v1/ping`, Python/JavaScript/TypeScript execution,
request timeout enforcement, empty stdin/EOF behavior, output and memory
limits, and that an HTTPS request from executed Python cannot reach the
external network.
