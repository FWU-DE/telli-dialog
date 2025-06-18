import { Page } from '@playwright/test';

export async function login(page: Page, user: string) {
  // Add a small delay and proper wait for navigation to complete in Firefox
  try {
    await page.goto('/logout', { waitUntil: 'networkidle' });
    // Add a small pause to ensure Firefox completes the request
    await page.waitForTimeout(100);
  } catch (error) {
    // If logout fails, continue anyway as we'll clear cookies next
    console.warn('Logout navigation failed, continuing with login process:', error);
  }
  
  await page.context().clearCookies();
  await page.waitForURL('**/login');

  await page.getByRole('button', { name: 'Mit VIDIS einloggen' }).click();

  await page.getByPlaceholder('Enter any login').fill(user);
  await page.getByPlaceholder('and password').fill('test');

  await page.getByRole('button', { name: 'Sign-in' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();

  await page.waitForURL('/');
}
