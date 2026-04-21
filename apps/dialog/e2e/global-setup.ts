import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, FullConfig } from '@playwright/test';
import { login } from './utils/login';
import { AUTH_FILES } from './utils/const';
import { selectDifferentModel } from './utils/chat';
import { LLM_MODELS } from './utils/llm-models';

/**
 * Global Playwright setup — runs once before all test suites.
 *
 * For each user defined in AUTH_FILES, it performs a real browser login
 * and saves the resulting storage state (cookies + localStorage) to a JSON
 * file under `.playwright-auth/`.
 *
 * Tests consume the saved state via `test.use({ storageState: AUTH_FILES.<user> })`,
 * which restores the session without repeating the login flow. This keeps
 * tests fast and avoids hitting the VIDIS OAuth flow on every test run.
 *
 * The auth files are git-ignored and regenerated automatically before each
 * `playwright test` invocation.
 */
export default async function globalSetup(config: FullConfig) {
  const baseUrl = config.projects[0]?.use.baseURL;
  if (!baseUrl) {
    throw new Error('Playwright globalSetup requires `use.baseURL` to be configured. ');
  }

  await using browser = await chromium.launch();

  for (const [user, file] of Object.entries(AUTH_FILES)) {
    await fs.mkdir(path.dirname(file), { recursive: true });

    await using context = await browser.newContext({ baseURL: baseUrl });
    const page = await context.newPage();

    await login(page, user);
    await selectDifferentModel(page, LLM_MODELS.TEXT_MODEL_1);
    await context.storageState({ path: file });

    await page.close();
  }
}
