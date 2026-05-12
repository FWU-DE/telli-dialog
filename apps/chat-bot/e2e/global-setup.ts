import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, FullConfig, Page } from '@playwright/test';
import { login } from './utils/login';
import { AUTH_FILES, LLM_MODELS_FILE } from './utils/const';
import { selectDifferentModel } from './utils/chat';
import { LLM_MODELS } from './utils/llm-models';

async function readModelsFromDropdown(page: Page): Promise<string[]> {
  const dropdown = page.getByLabel(`Select text Model Dropdown`);

  if (!(await dropdown.isVisible())) return [];

  const selectedModelName = await dropdown.locator('span').first().innerText();

  const isDisabled = await dropdown.evaluate((el) => (el as HTMLButtonElement).disabled);
  if (isDisabled) return selectedModelName ? [selectedModelName] : [];

  await dropdown.click();

  const otherModels = await page
    .getByRole('menuitem')
    .evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-testid')).filter((id) => id !== null),
    );

  await page.keyboard.press('Escape');

  return [selectedModelName, ...otherModels].filter(Boolean);
}

async function saveLlmModels(page: Page) {
  const llmModels = await readModelsFromDropdown(page);

  await fs.mkdir(path.dirname(LLM_MODELS_FILE), { recursive: true });
  await fs.writeFile(LLM_MODELS_FILE, JSON.stringify(llmModels, null, 2));
}

async function saveAuthState(baseUrl: string) {
  await using browser = await chromium.launch();
  let llmModelsSaved = false;

  for (const [user, file] of Object.entries(AUTH_FILES)) {
    await fs.mkdir(path.dirname(file), { recursive: true });

    await using context = await browser.newContext({ baseURL: baseUrl });
    const page = await context.newPage();

    await login(page, user);
    await selectDifferentModel(page, LLM_MODELS.TEXT_MODEL_1);

    if (!llmModelsSaved) {
      await saveLlmModels(page);
      llmModelsSaved = true;
    }

    await context.storageState({ path: file });

    await page.close();
  }
}

/**
 * Global Playwright setup — runs once before all test suites.
 *
 * - Reads available text models from the UI dropdown (menuitem data-testid) and
 *   writes their display names to LLM_MODELS_FILE so tests can discover them
 *   dynamically at load time.
 * - For each user defined in AUTH_FILES, performs a real browser login and
 *   saves the resulting storage state under `.playwright-auth/`. Tests restore
 *   this session via `test.use({ storageState: AUTH_FILES.<user> })`, avoiding
 *   repeated VIDIS OAuth flows.
 *
 * Both files are git-ignored and regenerated on every `playwright test` run.
 */
export default async function globalSetup(config: FullConfig) {
  const baseUrl = config.projects[0]?.use.baseURL;
  if (!baseUrl) {
    throw new Error('Playwright globalSetup requires `use.baseURL` to be configured. ');
  }

  await saveAuthState(baseUrl);
}
