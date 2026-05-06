# AGENTS.md

## Purpose

- Help coding agents ship safe changes quickly in the `ais-chat` monorepo (TypeScript + Turborepo).
- Prefer repository conventions from `.github/copilot-instructions.md` and concrete patterns in existing code.

## Architecture at a glance

- Monorepo layout: `apps/*` (deployables) + `packages/*` (shared libs), defined in `pnpm-workspace.yaml`.
- User-facing apps are Next.js: `apps/chat-bot` (main product) and `apps/admin` (configuration UI).
- Backend is Fastify: `apps/api` (`src/app.ts`, `src/handlers.ts`) exposing `/v1/*` and `/docs`.
- Two separate Postgres databases:
  - App/Admin DB in `packages/shared/src/db` (migrations + seed).
  - API DB in `packages/api-database/src` (schema in `schema.ts`, seed in `seed.ts`).
- AI flow: UI/apps call shared services, then API/LLM integration goes through `@ais-chat/ai-core`; `packages/shared/src/knotenpunkt/index.ts` calls `${env.apiUrl}/v1/models`.

## Service boundaries and code placement

- Keep business logic out of routes/components; put it in services/shared packages.
- Example pattern: `apps/admin/src/app/.../actions.ts` performs auth/validation and delegates to `apps/admin/src/services/*`.
- Keep cross-app logic framework-agnostic in `packages/shared-core/src`.
- Reuse UI from `@ais-chat/ui` before creating local components (`packages/ui/README.md`).

## Developer workflows (root)

- Install/tooling: `nvm use && corepack enable && corepack prepare && pnpm i`.
- Run all apps: `pnpm dev` (Turbo). Run one app: `pnpm dev:chat-bot`, `pnpm dev:admin`, `pnpm dev:api`.
- Quality gates: `pnpm format`, `pnpm lint`, `pnpm check-types`, `pnpm test`.
- DB lifecycle (both DBs): `pnpm db:migrate` then `pnpm db:seed`.
- Local infra dependencies: `docker compose -f devops/docker/docker-compose.local.yml up -d`.

## Project-specific conventions

- TypeScript only; keep modules small and explicit.
- Prefer React Server Components; add client components only for state/events/browser APIs.
- Internationalize UI text (chat-bot uses `next-intl`; see `apps/chat-bot/src/components/**` for `useTranslations(...)`).
- Do not add direct `console.*` in app code; use shared logging (`packages/shared/src/logging/logging.ts`) or API logger (`apps/api/src/logger.ts`).
- API request validation convention: Fastify implicit validator is disabled in `apps/api/src/app.ts`; validate using Zod schemas.

## Integrations and operational context

- Auth: Keycloak (local realm in `devops/docker/keycloak/ais-chat-local-realm.json`).
- Session/cache: Valkey from local docker compose.
- Storage: S3-compatible RustFS/OTC vars (`OTC_*` in `turbo.json` globalEnv).
- Observability: Sentry + OpenTelemetry across apps/packages (see dependencies and `turbo.json` envs).

## Agent execution checklist

- Before edits, identify target layer (`apps/*` vs `packages/*`) and affected database.
- If schema changes are needed, update the correct package (`packages/shared` or `packages/api-database`) and generate/apply migrations there.
- After edits, run quality gates from repo root and treat failures as blocking.
- Prefer minimal, composable changes that follow existing file/feature structure.
