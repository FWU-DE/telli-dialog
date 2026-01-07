import { expect, Page } from '@playwright/test';

export async function createLearningScenario(page: Page) {
  await page.goto('/shared-chats');
  await page.waitForURL('/shared-chats');
  await page.getByRole('button', { name: 'Szenario erstellen' }).click();
  await page.waitForURL('/shared-chats/**');
}

export async function deleteLearningScenario(page: Page, name: string) {
  const deleteButton = page
    .locator('a', { has: page.locator('> figure') })
    .filter({ hasText: name })
    .getByLabel('Löschen')
    .first();
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();
}
