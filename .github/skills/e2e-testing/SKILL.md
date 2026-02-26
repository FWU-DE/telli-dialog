---
name: e2e-testing
description: Generate, update, or debug Playwright end-to-end tests for the telli-dialog monorepo. Use this when asked to create e2e tests, update existing e2e tests, or write integration tests using Playwright.
---

# E2E Test Generation for telli-dialog

You are an expert at writing Playwright end-to-end tests for this monorepo. Follow these instructions carefully.

## Project Structure

This is a pnpm monorepo with three apps:

| App               | Path           | E2E location                                          | Playwright config                                      |
| ----------------- | -------------- | ----------------------------------------------------- | ------------------------------------------------------ |
| dialog (main app) | `apps/dialog/` | `apps/dialog/e2e/`                                    | `apps/dialog/playwright.config.ts`                     |
| admin             | `apps/admin/`  | _(no e2e tests yet — create under `apps/admin/e2e/`)_ | _(create `apps/admin/playwright.config.ts` if needed)_ |
| api               | `apps/api/`    | _(no e2e tests yet — create under `apps/api/e2e/`)_   | _(create `apps/api/playwright.config.ts` if needed)_   |

E2E tests for the **dialog** app are already established. For **admin** and **api**, if asked to create e2e tests, mirror the dialog structure and patterns.

## Dialog E2E Folder Layout

```
apps/dialog/e2e/
├── fixtures/            # Test fixture files (e.g. images for upload)
├── utils/               # Shared test helpers (login, chat, character, etc.)
│   ├── authorizationHeader.ts
│   ├── character.ts
│   ├── chat.ts
│   ├── const.ts
│   ├── custom-gpt.ts
│   ├── learning-scenario.ts
│   ├── login.ts
│   ├── mock.ts
│   ├── random.ts
│   └── utils.ts
└── tests/               # Test files, organized by feature
    ├── api/             # API-level tests (*.api.test.ts)
    ├── character/
    ├── custom-gpt/
    ├── generic-chat/
    ├── image-generation/
    ├── learning-scenarios/
    ├── teacher-login.test.ts
    ├── template-elements-visible.test.ts
    └── user-access.test.ts
```

## Conventions & Patterns

### Imports

Always import from `@playwright/test`:

```typescript
import { expect, test } from '@playwright/test';
```

Import helpers with relative paths from the `utils/` directory:

```typescript
import { login } from '../utils/login'; // top-level tests
import { login } from '../../utils/login'; // nested tests (e.g. character/)
import { sendMessage } from '../../utils/chat';
import { waitForToast } from '../../utils/utils';
```

### Login

All browser tests must start by logging in. Use the `login()` helper:

```typescript
await login(page, 'teacher'); // log in as teacher
await login(page, 'student'); // log in as student
```

The login helper navigates to `/logout`, clears cookies, navigates to `/login`, fills credentials via Keycloak, and waits for redirect to `/`.

### Test file naming

- **Browser e2e tests**: `<feature-name>.test.ts` (e.g. `create-character-chat.test.ts`)
- **API tests**: `<feature-name>.api.test.ts` (e.g. `costs.api.test.ts`)

API tests are matched by the Playwright config via `testMatch: /.*api.test.ts/` and run in a separate project without a browser.

### Test organization

- Group related tests in a `test.describe()` block with a descriptive name.
- Use `test.beforeEach()` for setup that varies per test (e.g. generating unique names).
- Use `nanoid` for generating unique identifiers to avoid test collisions:

```typescript
import { nanoid } from 'nanoid';
const characterName = 'My Character ' + nanoid(8);
```

### Existing utility functions

**Always reuse these helpers** instead of reimplementing their logic:

| Helper                                       | File                           | Purpose                                         |
| -------------------------------------------- | ------------------------------ | ----------------------------------------------- |
| `login(page, user, password?)`               | `utils/login.ts`               | Log in via Keycloak                             |
| `sendMessage(page, message)`                 | `utils/chat.ts`                | Type and send a chat message, wait for response |
| `regenerateMessage(page)`                    | `utils/chat.ts`                | Click reload and wait for new response          |
| `uploadFile(page, filePath)`                 | `utils/chat.ts`                | Upload a file via file input                    |
| `deleteChat(page, conversationId)`           | `utils/chat.ts`                | Delete a conversation via the sidebar menu      |
| `configureCharacter(page, data?)`            | `utils/character.ts`           | Fill in the character creation form             |
| `deleteCharacter(page, name)`                | `utils/character.ts`           | Delete a character by name                      |
| `deleteCustomGpt(page, name)`                | `utils/custom-gpt.ts`          | Delete a custom GPT by name                     |
| `createLearningScenario(page)`               | `utils/learning-scenario.ts`   | Navigate and click "Szenario erstellen"         |
| `configureLearningScenario(page, data?)`     | `utils/learning-scenario.ts`   | Fill in learning scenario form                  |
| `deleteLearningScenario(page, name)`         | `utils/learning-scenario.ts`   | Delete a learning scenario by name              |
| `deleteLearningScenarioFromDetailPage(page)` | `utils/learning-scenario.ts`   | Delete from the scenario detail page            |
| `waitForToast(page, msg?)`                   | `utils/utils.ts`               | Wait for a toast notification to appear         |
| `waitForToastDisappear(page)`                | `utils/utils.ts`               | Wait for toasts to disappear                    |
| `mockUserAndContext()`                       | `utils/mock.ts`                | Generate mock user data for API tests           |
| `mockLlmModel()`                             | `utils/mock.ts`                | Generate mock LLM model for API tests           |
| `mockConversationUsage()`                    | `utils/mock.ts`                | Generate mock usage data                        |
| `generateRandomString(n)`                    | `utils/random.ts`              | Random alphanumeric string                      |
| `authorizationHeader`                        | `utils/authorizationHeader.ts` | Bearer token header from `process.env.API_KEY`  |

If existing helpers don't cover the needed interaction, create a **new utility function** in the appropriate file inside `utils/`, or create a new utils file if the feature is new.

### Locator strategy

Follow Playwright best practices. Prefer these locator strategies **in order**:

1. **Role-based** — `page.getByRole('button', { name: '...' })`
2. **Label-based** — `page.getByLabel('...')`
3. **Text-based** — `page.getByText('...')`
4. **Title-based** — `page.getByTitle('...')`
5. **Placeholder-based** — `page.getByPlaceholder('...')`
6. **CSS selectors** — use only as a last resort

The UI is in **German**. Use German text for button names, labels, headings, and toast messages.

### Assertions

- Use `expect(locator).toBeVisible()` for visibility checks.
- Use `expect(locator).toContainText('...')` for content checks.
- Use `await page.waitForURL('/expected-path')` after navigation.
- Use `.toBeVisible({ timeout: 30000 })` for operations that may take longer (e.g. AI responses, image generation).

### Common patterns

**Navigate, create, verify, clean up:**

```typescript
test.describe('feature lifecycle', () => {
  const name = 'Test Item ' + nanoid(8);

  test('create item', async ({ page }) => {
    await login(page, 'teacher');
    // navigate to feature page
    // fill form
    // submit
    // verify item appears
  });

  test('delete item', async ({ page }) => {
    await login(page, 'teacher');
    // navigate to listing
    // delete the item
    // verify it's gone
  });
});
```

**Chat interaction:**

```typescript
await sendMessage(page, 'Your question here');
await expect(page.getByLabel('assistant message 1')).toContainText('expected content');
```

**Shared/invite code flow:**

```typescript
// Teacher creates and shares
await page.selectOption('#Telli-Points', '50');
await page.selectOption('#maxUsage', '45');
await page.getByTitle('Feature teilen').click();
await page.waitForURL('/feature/**/share');
const code = await page.locator('#join-code').textContent();

// Student/other user joins via code
await page.goto('/logout');
await page.waitForURL('/login');
await page.locator('#login-invite-code').fill(code ?? '');
await page.getByRole('button', { name: 'Zum Dialog' }).click();
```

**API tests (no browser):**

```typescript
import test, { expect } from '@playwright/test';
import { db } from '@shared/db';
import { someTable } from '@shared/db/schema';

test.describe('api feature', () => {
  test('should do something', async () => {
    // Direct DB operations and function calls
    const mock = mockUserAndContext();
    await db.insert(someTable).values({ ... });
    const result = await someFunction(mock);
    expect(result).toBe(expected);
  });
});
```

### Database access in tests

API tests can import from `@shared/db` and `@shared/db/schema` to read/write test data directly. Use `drizzle-orm` operators like `eq`, `and`, `inArray` for queries.

### Configuration

The Playwright config at `apps/dialog/playwright.config.ts` defines:

- `testDir`: `./e2e/tests/`
- `baseURL`: `http://localhost:3000`
- `workers`: 1 (sequential execution)
- `fullyParallel`: false
- `timeout`: 30 seconds per test
- Browser projects: `chromium`, `firefox`, and a separate `api test` project
- A `webServer` config that runs `pnpm dev` and waits for `http://localhost:3000`

### Running tests

From `apps/dialog/`:

```sh
pnpm e2e          # headless
pnpm e2e:headed   # visible browser
pnpm e2e:ui       # Playwright Test UI
pnpm e2e:api      # API tests only
```

## When creating tests for admin or api apps

If no e2e setup exists yet:

1. Create the folder structure mirroring `apps/dialog/e2e/` (i.e. `e2e/tests/`, `e2e/utils/`).
2. Create a `playwright.config.ts` adapted for the app's port and test directory.
3. Reuse patterns and conventions from dialog tests.
4. Add e2e scripts to the app's `package.json` (e.g. `"e2e": "playwright test"`).
5. Document what you created.

## Checklist before finishing

- [ ] Tests import from `@playwright/test` and use the existing utility helpers.
- [ ] New utility functions are added to `utils/` and exported, not inlined in tests.
- [ ] Tests use German UI text for locators (button names, labels, headings).
- [ ] Tests clean up after themselves (delete created entities).
- [ ] Unique identifiers use `nanoid` to avoid collisions.
- [ ] API test files are named `*.api.test.ts`.
- [ ] Test file is placed in the correct subdirectory under `e2e/tests/`.
- [ ] No hardcoded waits — use Playwright auto-waiting, `waitForURL`, or `expect().toBeVisible()`.
