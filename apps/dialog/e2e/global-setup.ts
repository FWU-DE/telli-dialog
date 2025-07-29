import { config as dotenvConfig } from '@dotenvx/dotenvx';
import { type FullConfig } from '@playwright/test';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function globalSetup(config: FullConfig) {
  const filePath = path.join(__dirname, './../.env.local');
  dotenvConfig({ path: filePath });
}

export default globalSetup;
