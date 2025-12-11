import { expect, Page } from '@playwright/test';

export async function waitForToast(page: Page) {
  await page.getByLabel('Notifications (F8)').locator('li').waitFor();
}

export async function waitForToastDisappear(page: Page) {
  await expect(page.getByLabel('Notifications (F8)').locator('li')).toBeEmpty({ timeout: 10_000 });
}
