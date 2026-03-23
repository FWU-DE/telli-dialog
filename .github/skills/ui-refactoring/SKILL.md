---
name: ui-refactoring
description: Refactor or modernize existing React/Next.js UI code in the telli-dialog monorepo while preserving behavior. Use this when asked to clean up components, improve structure/readability, reduce duplication, migrate to shared UI primitives, or simplify frontend code without changing product behavior.
---

# UI Refactoring for telli-dialog

You are an expert at refactoring UI code in this monorepo. Focus on maintainability, consistency, and minimal-risk changes. This is a legacy codebase where most of the components are old and use radix controls.
The goal is to implement a new UI design using shadcn components that are in shared/ui.
We also implement a new theme with dark and light mode.
Accessibility and i18n are also important.

## Goals

- Preserve existing user behavior unless the request explicitly asks for UX changes.
- Improve readability, modularity, and reuse.
- Reduce duplication and dead code.
- The old components should not be used as template for new ones.
- Alredy refactored components that can be used as an example are custom-chat components in src/components/custom-chat.
- Do not add additional styling by yourself. Only use the new theme and shadcn components.
- Do not change existing legacy components. If necessary, create a copy of the component and refactor the copy. The old component should not be deleted or modified.

## Monorepo Context

- `apps/dialog/` and `apps/admin/` are Next.js apps (App Router).
- Shared UI primitives live in `packages/ui/src/components/`.
- Shared business and utility logic lives in `packages/shared/`.
- Styling is Tailwind + project theme primitives; avoid introducing new design tokens unless requested.

## Refactoring Rules

1. Keep behavior stable

- Do not change feature semantics or flow unless explicitly requested.
- Prefer structural refactors over visual redesigns.

2. Prefer existing primitives

- Reuse shadcn-style components from `@telli/ui` before introducing custom components.
- Extract repeated UI patterns into small reusable components in app-local component folders.

3. Keep business logic out of UI

- Move data manipulation and business decisions into services/utilities where appropriate.
- Components should mainly orchestrate rendering and user interaction.

4. Respect server/client boundaries

- Prefer React Server Components by default.
- Use client components only when state, events, or browser APIs are required.
- Avoid unnecessary `"use client"`.

5. Maintain i18n readiness

- Avoid hardcoding user-facing strings when the surrounding codebase uses translation patterns.
- Keep text extraction straightforward for localization.

6. Logging and errors

- Do not use `console.*` in application code.
- Use shared logging helpers from `packages/shared/src/logging/logging.ts` when logging is needed.
- Keep error handling explicit and predictable.

7. Keep changes scoped

- Perform the smallest set of edits needed.
- Do not perform unrelated renames/moves.
- Avoid adding new dependencies unless clearly justified.

## UI Refactor Workflow

1. Baseline understanding

- Identify the current component boundaries, props flow, and data dependencies.
- Spot duplication, large components, and mixed concerns.

2. Plan minimal extraction

- Split large components into focused subcomponents/hooks/utils.
- Normalize naming and prop shapes where safe.

3. Apply targeted edits

- Refactor incrementally with clear, low-risk steps.
- Preserve public APIs unless the request allows breaking changes.

4. Validate

- Run the most relevant tests/lint for touched areas.
- Confirm no type errors introduced by the refactor.

5. Summarize

- Explain what was refactored, why, and any behavior intentionally unchanged.

## Preferred Patterns

- Composition over prop-heavy monolith components.
- Colocate small helpers when truly local; move reusable helpers to shared locations.
- Keep hooks focused and side effects explicit.
- Use descriptive names for components and handlers.

## Anti-patterns to Avoid

- Mixing API/business logic deeply inside rendering components.
- Introducing broad visual changes when not requested.
- Adding one-off styling that bypasses existing design system patterns.
- Refactoring unrelated files “while here.”

## Output Expectations

When performing UI refactors:

- Clearly state unchanged behavior assumptions.
- List the files/components touched.
- Highlight risk areas (if any), such as event handling, state shape, or SSR/CSR boundaries.
- Keep explanation concise and implementation-focused.
