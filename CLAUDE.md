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

**Beide** müssen aktualisiert werden wenn ein Modell-Feld geändert wird (`llmModelTable` existiert in beiden!). Checkliste bei neuen Feldern:

1. Schema + Migration in **beiden** Paketen (`pnpm db:generate && pnpm db:migrate:local`)
2. `createSelectSchema`-Override in `packages/shared/src/db/schema.ts` — `.$type<>()` auf Drizzle-Spalten wird von drizzle-zod **ignoriert**, deshalb muss der Typ explizit überschrieben werden:
   ```ts
   export const llmModelSelectSchema = createSelectSchema(llmModelTable, {
     tier: z.enum(['fast', 'balanced', 'powerful']).nullable(),
   });
   ```
3. E2E-Mock aktualisieren: `apps/chat-bot/e2e/utils/mock.ts` → `mockLlmModel()`
4. API-Test-Fixture aktualisieren: `apps/api/src/routes/(app)/v1/models/utils.test.ts` → `baseModel`
5. Neue Felder im Knotenpunkt-Upsert (`dbUpsertLlmModelsByModelsAndFederalStateId`) explizit auf `null` setzen, weil die Knotenpunkt-API sie nicht kennt

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

## React-Konventionen

**Kein synchrones `setState` im Effect-Body** (ESLint-Regel `react-hooks/set-state-in-effect`). Initialwert der von `window` abhängt in den `useState`-Lazy-Initializer:

```ts
// ✗ — löst Lint-Fehler aus
const [isDesktop, setIsDesktop] = useState(true);
useEffect(() => {
  setIsDesktop(window.matchMedia('(min-width: 768px)').matches); // synchrones setState
  ...
}, []);

// ✓
const [isDesktop, setIsDesktop] = useState(
  () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
);
useEffect(() => {
  const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches); // nur Listener
  ...
}, []);
```

**Tailwind-Klassen nicht dynamisch zusammenbauen** — Tailwind purgt Klassen, die nicht als vollständiger String im Code stehen. Statt `hidden ${isMobile ? 'md:block' : ''}` lieber JS-Konditionierung mit `&&` oder einem `useState`-Hook.

## Tests / Vitest

**`vi.mock`-Factories werden hochgezogen** — Variablen aus dem Modul-Scope sind noch nicht initialisiert. Geteilten Mock-State immer mit `vi.hoisted()` anlegen:

```ts
const { myMock } = vi.hoisted(() => {
  const myMock = vi.fn();
  return { myMock };
});
vi.mock('./some-module', () => ({ fn: myMock }));
```

## Git-Workflow

Feature-Branches **immer von `main` starten**, nie von einem anderen Feature-Branch — sonst enthält der PR alle Commits des anderen Branches und Codecov/CI werden verrückt.

## Code-Qualität vor dem Commit

Immer vor dem Commit ausführen:

```sh
pnpm prettier --write <datei>   # oder: pnpm prettier --write .
pnpm lint                       # ESLint mit --max-warnings 0
```

CI prüft beides (`format:check` + `lint`). Prettier-Fehler erzeugen ESLint-Errors via `prettier/prettier`-Regel — beides zusammen fixen spart einen CI-Zyklus.

Screenshots für Pull Requests **nicht ins Repo committen** — direkt per Drag-and-Drop in die PR-Beschreibung auf GitHub hochladen (erzeugt `user-attachments`-URLs).

## Konventionen

- Beschreibungen zu Modellen sind im Feld `description` auf `llmModelTable` — bereits im UI sichtbar
- Feature Flags nie als `NEXT_PUBLIC_`-Env-Var — immer über das Bundesland-System
