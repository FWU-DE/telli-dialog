import { expect, Page } from '@playwright/test';

export async function waitForToast(page: Page, msg?: string) {
  await page.getByLabel('Notifications (F8)').locator('li', { hasText: msg }).waitFor();
}

export async function waitForToastDisappear(page: Page) {
  await expect(page.getByLabel('Notifications (F8)').locator('li')).toBeHidden();
}
