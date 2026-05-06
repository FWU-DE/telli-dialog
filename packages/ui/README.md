# @telli/ui

Shared UI component package for the telli monorepo.

## shadcn adapter setup

This package keeps canonical components in `src/components` with PascalCase file names (for example `Button.tsx`).

To make the `shadcn` CLI detect installed components, `components.json` maps the `ui` alias to `@telli/ui/components/ui`.

- `components.json`:
  - `aliases.ui = "@telli/ui/components/ui"`
- adapter files live in `src/components/ui`
- each adapter re-exports from the canonical PascalCase component

Example:

- `src/components/ui/button.tsx` re-exports from `../Button`
- `src/components/ui/alert-dialog.tsx` re-exports from `../AlertDialog`

This gives us both:

- stable internal component layout in `src/components`
- correct shadcn installed-component detection in `shadcn info`

## adding a new shadcn component

When adding a new component, keep both files in sync:

1. Add or update the canonical component in `src/components`.
2. Add a matching kebab-case adapter file in `src/components/ui` that re-exports it.
3. Verify detection with:

```bash
pnpx shadcn info -c packages/ui
```
