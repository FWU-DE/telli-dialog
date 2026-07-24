---
name: dependency-checker
description: Run dependency analysis when asked to check dependencies. Use this skill to detect circular dependencies in TypeScript files and resolve them using madge.
---

## When to use

Use this skill when the user asks to:

- Run a dependency check
- Find circular dependencies
- Resolve import cycles
- Verify dependency graph health

## Goal

Find circular dependencies across the whole repository for `.ts` and `.tsx` files, resolve them, and verify no cycles remain.

## Required tool

- Use `madge` for dependency analysis (do not use `npx`)
- `madge` is installed as a dev dependency at repository root.
- Default command: `pnpm exec madge`

## Detect circular dependencies

From the repository root, run:

```sh
pnpm exec madge . --extensions ts,tsx --circular --json
```

If needed, persist output to a file for inspection:

```sh
pnpm exec madge . --extensions ts,tsx --circular --json > madge-circular.json
```

Notes:

- Scope is the whole repository.
- Only `.ts` and `.tsx` files are analyzed via `--extensions ts,tsx`.
- JSON output is required.

## Interpret JSON output

- Empty array (`[]`) means no circular dependencies found.
- Non-empty output contains one or more cycles.
- Each cycle should be treated as a concrete fix target.

## Resolve cycles

For each cycle, inspect the involved files and break the dependency loop with minimal safe changes.
Prefer these strategies:

- Replace runtime imports with type-only imports when only types are needed:
  ```ts
  import type { MyType } from './types';
  ```
- Extract shared types/constants/interfaces into a new leaf module that neither side depends on cyclically.
- Keep barrel (`index.ts`) files for public module exports, but disallow same-module internal imports through that barrel; use direct relative imports instead.
- Invert dependencies (pass callbacks/data through parameters instead of importing upstream modules).
- Move side-effectful initialization into a higher-level composition module.

### Barrel usage rule

- Use `index.ts` as the public API boundary for consumers outside the module.
- Inside the same module, import sibling files directly via relative paths.
- Avoid internal imports like `from './index'` because they can create hidden back-edges and cycles.

Keep behavior unchanged while removing the cycle.

## Verify after fixes

Re-run madge:

```sh
pnpm exec madge . --extensions ts,tsx --circular --json
```

Success criteria:

- Output is `[]`.
- No new type or lint errors introduced by the refactor.
- Unit tests pass.

## Optional follow-up checks

After cycle fixes, run repository verification tasks if requested:

```sh
pnpm run lint
pnpm run check-types
pnpm run test
```
