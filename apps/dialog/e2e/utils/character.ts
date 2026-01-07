import { expect, Page } from '@playwright/test';

export async function deleteCharacter(page: Page, name: string) {
  const deleteButton = page
    .locator('a', { has: page.locator('> figure') })
    .filter({ hasText: name })
    .getByLabel('Dialogpartner löschen')
    .first();
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();
}
