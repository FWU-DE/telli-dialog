import { Page } from '@playwright/test';

export async function waitForToast(page: Page) {
  await page.getByLabel('Notifications (F8)').locator('li').waitFor();
}

export async function regenerateMessage(page: Page) {
  await page.getByLabel('Reload').click();
  await page.getByLabel('Reload').waitFor({ state: 'hidden' });
  await page.getByLabel('Reload').waitFor();
}

export async function sendMessage(page: Page, message: string) {
  await page.getByPlaceholder('Wie kann ich Dir helfen?').fill(message);
  await page.keyboard.press('Enter');
  await page.getByLabel('Reload').waitFor();
}
