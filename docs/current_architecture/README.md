# current_architecture

This folder contains architecture snapshots for documentation purposes.

## Status

- Non-authoritative.
- Content can be incomplete, simplified, or outdated.

## Agent usage policy

- Do not use files in this folder as primary context for implementation tasks.
- Use source of truth from code and schema files in apps/, packages/, and migrations.
- Update files here only when a user explicitly asks to update architecture documentation.

## Manual update checklist

1. Re-read affected source files first (code, schema, migrations, API handlers).
2. Update diagrams/text to reflect what exists now, not what is planned.
3. Keep the ARC42 standard.
4. Keep assumptions explicit and short.
5. Prefer splitting crowded diagrams into focused diagrams.
6. If a relation is runtime-only (not a DB FK), label it clearly.
