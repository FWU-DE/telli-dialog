import { Page } from '@playwright/test';

export async function login(page: Page, user: string) {
  try {
    await page.goto('/logout');
  } catch (error) {
    // If logout fails, continue anyway as we'll clear cookies next this only happens on firefox
    console.warn('Logout navigation failed, continuing with login process:', error);
  }

  await page.context().clearCookies();
  await page.goto('/login');
  await page.waitForURL('**/login');

  await page.getByRole('button', { name: 'Mit VIDIS einloggen' }).click();

  await page.getByPlaceholder('Enter any login').fill(user);
  await page.getByPlaceholder('and password').fill('test');

  await page.getByRole('button', { name: 'Sign-in' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.waitForURL('/');
}
