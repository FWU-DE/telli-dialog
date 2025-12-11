import { Page } from '@playwright/test';

export async function createLearningScenario(page: Page) {
  await page.goto('/shared-chats');
  await page.waitForURL('/shared-chats');
  await page.getByRole('button', { name: 'Szenario erstellen' }).click();
  await page.waitForURL('/shared-chats/**');
}
