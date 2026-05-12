import { expect, Page } from '@playwright/test';

export async function waitForToast(page: Page, msg?: string) {
  await page.getByLabel('Notifications (F8)').locator('li', { hasText: msg }).waitFor();
}

export async function waitForToastDisappear(page: Page) {
  await expect(page.getByLabel('Notifications (F8)').locator('li')).toBeHidden();
}

export async function waitForChatHistory(page: Page) {
  await page.getByTestId('chat-search').waitFor();
  await expect(page.getByTestId('chat-history-loading')).toBeHidden();
}

export async function waitForAutosave(page: Page) {
  await expect(page.getByTestId('autosave-saved').first()).toBeVisible({ timeout: 5000 });
}

export async function confirmDuplicate(page: Page) {
  const confirmButton = page.getByTestId('custom-chat-confirm-button').first();
  await expect(confirmButton).toBeVisible();
  await confirmButton.click();
}
