import { expect, Page } from '@playwright/test';

export async function deleteCustomGpt(page: Page, name: string) {
  const deleteButton = page
    .locator('div', { has: page.locator('> figure') })
    .filter({ hasText: name })
    .getByLabel('Assistenten löschen')
    .first();
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();
}
