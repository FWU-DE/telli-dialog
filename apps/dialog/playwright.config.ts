import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */

export default defineConfig({
  testDir: './e2e/tests/',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html'], ['json'], ['github'], ['list']],
  timeout: 0.5 * 60 * 1000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'on',
  },
  globalSetup: './e2e/global-setup.ts',
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      testIgnore: /.*api.test.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'firefox',
      testIgnore: /.*api.test.ts/,
      use: {
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'api test',
      testMatch: /.*api.test.ts/,
    },
    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],
  webServer: {
    command: 'pnpm dev',
    timeout: 60000, // wait 60 seconds for web server at url to be available
    url: 'http://localhost:3000', // the server to be used for tests
    reuseExistingServer: true,
    stdout: 'pipe',
  },
});
