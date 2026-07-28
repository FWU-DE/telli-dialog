import { expect, Page } from '@playwright/test';

export async function startShare(page: Page, { id }: { id: string }) {
  await page.waitForURL(`**/editor/${id}**`);

  await page.getByTestId('usage-time-select').click();
  await page.getByTestId('usage-time-option-30').click();
  await page.getByTestId('start-share-button').click();

  await page.waitForURL(`**/editor/${id}/share`);

  // Navigate back to editor so the caller can interact with the active share UI
  await page.goBack();
  await page.waitForURL(`**/editor/${id}**`);
}

export async function stopShare(page: Page) {
  const stopButton = page.getByTestId('stop-share-button');
  await expect(stopButton).toBeVisible();
  await page.waitForLoadState('networkidle');
  await stopButton.click();

  const stopShareDialog = page.getByTestId('stop-share-dialog');
  await expect(stopShareDialog).toBeVisible();
  await page.getByTestId('stop-share-confirm-button').click();
  await expect(stopShareDialog).not.toBeVisible();
}

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
