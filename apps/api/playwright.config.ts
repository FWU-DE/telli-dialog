import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.test for the test API key (sk_ format for client auth)
// The API server itself loads .env.local via its own load-env.ts
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './e2e/tests/',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: './playwright-report' }], ['list']],
  timeout: 60_000,
  use: {
    baseURL: process.env.API_BASE_URL ?? 'http://localhost:3002',
  },
  projects: [
    {
      name: 'api',
      testMatch: /.*\.api\.test\.ts/,
    },
  ],
  webServer: {
    command: 'pnpm dev',
    timeout: 30_000,
    url: 'http://localhost:3002/health',
    reuseExistingServer: true,
    stdout: 'pipe',
  },
});
