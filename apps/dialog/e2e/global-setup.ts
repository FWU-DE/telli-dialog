import fs from 'node:fs/promises';
import path from 'node:path';
import { FullConfig, chromium } from '@playwright/test';
import { login } from './utils/login';
import { AUTH_FILES } from './utils/const';

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;
  if (!baseURL) return;

  const browser = await chromium.launch();

  for (const [user, file] of Object.entries(AUTH_FILES)) {
    await fs.mkdir(path.dirname(file), { recursive: true });

    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();

    await login(page, user);
    await context.storageState({ path: file });

    await page.close();
    await context.close();
  }

  await browser.close();
}
