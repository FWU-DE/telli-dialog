import { expect, Page } from '@playwright/test';

export async function createLearningScenario(page: Page) {
  await page.goto('/learning-scenarios');
  await page.waitForURL('/learning-scenarios');
  await page.getByRole('button', { name: 'Szenario erstellen' }).click();
  await page.waitForURL('/learning-scenarios/**');
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
