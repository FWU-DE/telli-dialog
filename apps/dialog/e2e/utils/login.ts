import { Page } from '@playwright/test';

export async function login(page: Page, user: string, password = 'password') {
  try {
    await page.goto('/logout');
    // After successful logout, user is redirected to /login
    await page.waitForURL('/login');
  } catch (error) {
    // If logout fails, continue anyway as we'll clear cookies next this only happens on firefox
    console.warn('Logout navigation failed, continuing with login process:', error);
  }

  await page.context().clearCookies();

  try {
    await page.goto('/login');
  } catch {
    // Login navigation might fail on firefox, wait instead for URL
    await page.waitForURL('/login');
  }

  await page.getByRole('button', { name: 'Mit VIDIS einloggen' }).click();

  await page.getByLabel('Username').fill(user);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);

  await page.locator('button[type=submit]').click();

  await page.waitForURL('/');
}
