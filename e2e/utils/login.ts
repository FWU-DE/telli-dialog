import { Page } from '@playwright/test';

export async function login(page: Page, user: 'teacher' | 'student') {
  await page.goto('/logout');
  await page.waitForURL('**/login');

  await page.getByRole('button', { name: 'Mit VIDIS einloggen' }).click();

  await page.getByPlaceholder('Enter any login').fill(user);
  await page.getByPlaceholder('and password').fill('test');

  await page.getByRole('button', { name: 'Sign-in' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.waitForURL('/');
}
