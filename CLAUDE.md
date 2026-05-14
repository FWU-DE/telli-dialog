# AIS.chat — Claude Code Guide

## Stack

- **Monorepo:** Turbo + pnpm workspaces
- **Frontend:** Next.js (React) — `apps/chat-bot`, `apps/admin`
- **Backend:** Fastify — `apps/api`
- **DB:** PostgreSQL + Drizzle ORM
- **Shared logic:** `packages/shared`, `packages/ai-core`, `packages/api-database`

## Lokale Entwicklung

```sh
docker compose -f devops/docker/docker-compose.yml up -d  # DB, Keycloak, S3
pnpm dev  # alle Apps parallel
```

Apps: chat-bot → :3000, admin → :3001, API → :3002

## Datenbank-Migrationen (Drizzle)

Es gibt **zwei separate Datenbanken** mit je eigenem Schema und Migrations-Workflow:

| Package                 | Datenbank            | Schema-Datei       | Wofür                                               |
| ----------------------- | -------------------- | ------------------ | --------------------------------------------------- |
| `packages/api-database` | `api_db` (Port 5432) | `src/schema.ts`    | LLM-Modelle, API-Keys, Organisationen               |
| `packages/shared`       | `app_db` (Port 5432) | `src/db/schema.ts` | Nutzer, Konversationen, Bundesländer, Feature Flags |

**Beide** müssen aktualisiert werden wenn ein Modell-Feld geändert wird (z.B. `llmModelTable` existiert in beiden!).

```sh
# api_db
cd packages/api-database
pnpm db:generate && pnpm db:migrate:local

# app_db
cd packages/shared
pnpm db:generate && pnpm db:migrate:local
```

## Feature Flags

Flags sind **pro Bundesland** in der DB gespeichert (`federal_state.feature_toggles` JSON-Spalte).

**Schema definieren** in `packages/shared/src/db/schema.ts` → `federalStateFeatureTogglesSchema`:

```ts
isMyFeatureEnabled: z.boolean().optional(),
```

**Zugriff** überall via `federalState.featureToggles`:

```ts
const isEnabled = federalState.featureToggles?.isMyFeatureEnabled ?? false;
```

**Admin-UI** zum Ein-/Ausschalten: `apps/admin/src/app/ais-chat-app/federal-states/[federalStateId]/FederalStateDetailView.tsx`

Neue Flags standardmäßig `optional()` (nicht `.default(true)`), damit sie initial `undefined`/`false` sind.

## Modell-Konfiguration

- Modelle in DB: `packages/api-database/src/schema.ts` → `llmModelTable`
- Default-Modelle: `packages/shared/src/llm-models/default-llm-models.ts`
- LLM-Einstiegspunkte (mit Billing): `packages/ai-core/src/chat/index.ts`
- Provider-Routing: `packages/ai-core/src/chat/providers/index.ts`

Model-Auswahl-Priorität im Chat: Query-Param → letzte Nachricht → User-Präferenz → `DEFAULT_CHAT_MODEL`

## Konventionen

- Beschreibungen zu Modellen sind im Feld `description` auf `llmModelTable` — bereits im UI sichtbar
- Feature Flags nie als `NEXT_PUBLIC_`-Env-Var — immer über das Bundesland-System
