import { expect, Page } from '@playwright/test';

export async function deleteAssistant(page: Page, name: string) {
  const card = page.getByRole('button', { name }).first();
  await expect(card).toBeVisible({ timeout: 15000 });
  await card.click();
  await page.waitForURL('/assistants/editor/**');
  const deleteButton = page.getByTestId('custom-chat-delete-button').first();
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();
}
