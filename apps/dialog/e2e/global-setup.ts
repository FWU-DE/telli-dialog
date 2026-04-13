import fs from 'node:fs/promises';
import path from 'node:path';
import { FullConfig, chromium } from '@playwright/test';
import { login } from './utils/login';
import { AUTH_FILES } from './utils/const';

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
    await context.storageState({ path: file });

    await page.close();
  }
}
