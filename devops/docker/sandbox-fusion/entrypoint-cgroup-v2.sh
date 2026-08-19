#!/bin/sh
set -eu

root=/sys/fs/cgroup
service="$root/sandbox-fusion-service"
test -f "$root/cgroup.controllers" || { echo 'cgroup v2 is required' >&2; exit 1; }
mkdir -p "$service"
echo "$$" > "$service/cgroup.procs"
echo '+memory +cpu' > "$root/cgroup.subtree_control"
exec "$@"
