# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Documentation Index

- **[README.md](README.md)** — Setup instructions, quick start, local development, Docker usage
- **[AGENTS.md](AGENTS.md)** — Agent-specific guidance, architecture overview, developer workflows, project conventions
- **[docs/structure.md](docs/structure.md)** — Detailed project structure and directory purpose
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** — Code style, naming conventions, component patterns
- **[apps/chat-bot/e2e/README.md](apps/chat-bot/e2e/README.md)** — E2E and load testing guide
- **[SECURITY.md](SECURITY.md)** — Security issue reporting

## Quick Reference

### Tech Stack

TypeScript monorepo (Turborepo + pnpm) with:

- **Frontend**: Next.js 16 App Router, React Server Components, TailwindCSS, shadcn/ui
- **Backend**: Fastify API with OpenAPI/Swagger at `/docs`
- **Databases**: Two separate PostgreSQL databases (see Architecture section)
- **Auth**: Keycloak | **Cache**: Valkey | **Storage**: S3-compatible
- **Testing**: Vitest (unit), Playwright (e2e)

### Architecture Overview

See [AGENTS.md](AGENTS.md) and [docs/structure.md](docs/structure.md) for complete details.

**Key insight**: Two separate databases with different purposes:

1. **App/Admin DB** (`packages/shared/src/db/`) — Used by `apps/chat-bot/` and `apps/admin/`, connection: `DATABASE_URL`
2. **API DB** (`packages/api-database/`) — Used by `apps/api/`, connection: `API_DATABASE_URL`

**Critical patterns**:

- `apps/api/src/app.ts` disables Fastify's implicit validation; always validate with Zod schemas
- Keep business logic in services (`packages/shared/src/**/*.ts`), not routes/components
- Cross-app logic goes in `packages/shared-core/src` (framework-agnostic)
- AI flow: UI → shared services → `@ais-chat/ai-core` → knotenpunkt → `${env.apiUrl}/v1/models`

## Essential Commands

See [README.md](README.md) for complete setup and usage instructions. Key commands:

### Setup & Development

```sh
nvm use && corepack enable && corepack prepare && pnpm i  # Initial setup
pnpm dev                 # Run all apps (or pnpm dev:chat-bot, dev:admin, dev:api)
```

### Database (Both Required)

```sh
pnpm db:migrate          # Migrate both databases
pnpm db:seed             # Seed both databases (requires API keys + LLM credentials in .env.local)
```

### Quality Gates (Always Run After Changes)

```sh
pnpm format && pnpm lint && pnpm check-types && pnpm test
```

**Critical**: Check exit codes (0 = success). Turbo cache may show "successful" even when packages failed.

### Testing

```sh
pnpm test                           # Unit tests (Vitest)
cd apps/chat-bot && pnpm e2e        # E2E tests (Playwright) - see apps/chat-bot/e2e/README.md
```

### Docker

```sh
docker compose -f devops/docker/docker-compose.local.yml up -d  # Local services
docker compose -f devops/docker/monitoring.yml up -d            # Observability stack
```

## Critical Conventions

See [.github/copilot-instructions.md](.github/copilot-instructions.md) and [AGENTS.md](AGENTS.md) for complete conventions. Non-obvious rules:

### Logging (Never Console)

- **DO NOT use `console.*`** in application code
- Use `packages/shared/src/logging/logging.ts` (Next.js apps) or `apps/api/src/logger.ts` (API)

### Internationalization

- **All UI text must be internationalized** — chat-bot uses `next-intl`
- See `apps/chat-bot/src/components/**` for `useTranslations(...)` pattern

### Validation

- Fastify's implicit validation is **disabled** in `apps/api/src/app.ts`
- Always validate API requests with Zod schemas

### Database Changes

1. Identify target database: `packages/shared` (app/admin) vs `packages/api-database` (API)
2. Update schema in correct package
3. Generate migration: `pnpm db:generate` in that package
4. Apply: `pnpm db:migrate` from root

### Component Reuse

- Check `packages/ui/` (shadcn/ui) before creating custom components
- Follow shadcn patterns for accessibility and responsiveness

### File Placement

- Business logic → services (`packages/shared/src/**/*.ts`), not routes/components
- Cross-app utilities → `packages/shared-core/src` (framework-agnostic)
- Example: `apps/admin/src/app/.../actions.ts` validates, delegates to `packages/shared/src/**/*.ts`

### React Patterns

- Prefer Server Components; use client components only for state/events/browser APIs
- Keep state close to where it's used

## Pre-Edit Checklist

1. Identify target: `apps/*` vs `packages/*`
2. If database change: which DB? (`packages/shared` or `packages/api-database`)
3. After edits: `pnpm format && pnpm lint && pnpm check-types && pnpm test`
4. Check exit codes (0 = success), not summary messages
