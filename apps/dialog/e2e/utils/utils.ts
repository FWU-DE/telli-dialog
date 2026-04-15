import { expect, Page } from '@playwright/test';

export async function waitForToast(page: Page, msg?: string) {
  await page.getByLabel('Notifications (F8)').locator('li', { hasText: msg }).waitFor();
}

export async function waitForToastDisappear(page: Page) {
  await expect(page.getByLabel('Notifications (F8)').locator('li')).toBeHidden();
}

export async function waitForChatHistory(page: Page) {
  await page.getByLabel('Chat suchen').waitFor();
  await expect(page.getByTestId('chat-history-loading')).toBeHidden();
}
