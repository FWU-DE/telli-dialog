# Local Judge0 CE 1.13.1

This directory provides an isolated Judge0 CE deployment for the code gateway. Images are
version-pinned: Judge0 CE `1.13.1`, PostgreSQL `16.8-alpine`, and Redis `7.4.2-alpine`.

```sh
export JUDGE0_DB_PASSWORD='use-a-local-secret'
export JUDGE0_TOKEN='use-a-different-random-secret-at-least-32-characters'
docker compose -f devops/docker/judge0/docker-compose.yml up -d
```

The compose network is internal. PostgreSQL and Redis publish no ports. Judge0 binds only to the
host loopback interface at `127.0.0.1:2358` so the repository's normal host-run API can reach it;
it is not reachable from the LAN or internet. Set `JUDGE0_URL=http://127.0.0.1:2358`. Do not expose
Judge0 through a reverse proxy or change this to a wildcard host binding.

The database and Redis use ephemeral storage, and the gateway deletes every submission after
collecting its bounded result, including timed-out submissions. Restarting this stack clears any
submission left behind by an abrupt process or host failure.

For the packaged `devops/docker/docker-compose.yml` stack, start this Judge0 compose first. Its
named private network is attached to Keycloak's shared network namespace, and the packaged API uses
`JUDGE0_URL=http://judge0-server:2358` without publishing Judge0 publicly.

Workers are intentionally `privileged`, as required by Judge0's sandbox implementation. This is
acceptable only on a dedicated trusted host/VM with no unrelated workloads. In production put
workers on a separate hardened host/VM and restrict access so only the unprivileged API gateway
can reach the Judge0 server. The API never mounts the Docker socket and never runs Docker.

Judge0 CE 1.13.1's `isolate` sandbox requires the cgroup v1 memory controller. Current WSL kernels
support cgroup v2 only, so code execution does not work under WSL even though the services themselves
run in Docker. Docker-in-Docker does not help because nested containers still share the WSL kernel.
Use a dedicated cgroup-v1-capable Linux VM for local integration and production deployment.

The gateway always sends `enable_network: false` and fixed resource limits; do not weaken these
values through request fields or environment overrides. Judge0's dangerous features remain
disabled by the worker configuration, and all Judge0 endpoints require a private token. The API
also limits each process to four concurrent
executions. Scale and rate-limit the API deliberately rather than exposing Judge0 directly.
