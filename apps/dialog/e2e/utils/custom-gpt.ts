import { expect, Page } from '@playwright/test';

export async function deleteCustomGpt(page: Page, name: string) {
  const card = page.getByRole('button', { name }).first();
  await expect(card).toBeVisible();
  await card.click();
  await page.waitForURL('/custom/editor/**');
  const deleteButton = page.getByRole('button', { name: 'Assistenten löschen' });
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();
}
