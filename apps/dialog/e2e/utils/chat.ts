import { expect, Page } from '@playwright/test';
import { waitForToast } from './utils';

export async function regenerateMessage(page: Page) {
  await page.getByLabel('Reload').click();
  await page.getByLabel('Reload').waitFor({ state: 'hidden' });
  await page.getByLabel('Reload').waitFor();
}

export async function sendMessage(page: Page, message: string) {
  await page.getByPlaceholder('Wie kann ich Dir helfen?').fill(message);
  await page.keyboard.press('Enter');
  await page.getByLabel('Reload').waitFor();
}

export async function uploadFile(page: Page, filePath: string) {
  const fileInput = page.locator('input[type="file"]');

  const uploadPromise = page.waitForResponse('/api/v1/files');
  await fileInput.setInputFiles(filePath);

  // Wait for the upload to complete
  const result = await uploadPromise;
  expect(result.status()).toBe(200);

  // Wait for the loading spinner to disappear
  await page.locator('form svg.animate-spin').waitFor({ state: 'detached' });
}

export async function deleteChat(page: Page, conversationId: string) {
  const label = page.locator('div', { has: page.locator(`a[href="/d/${conversationId}"]`) }).last();

  // Ensure element is in viewport
  await label.scrollIntoViewIfNeeded();

  // Firefox-specific approach: get bounding box and move mouse physically
  const boundingBox = await label.boundingBox();
  if (boundingBox) {
    // Move mouse to the center of the element
    await page.mouse.move(
      boundingBox.x + boundingBox.width / 2,
      boundingBox.y + boundingBox.height / 2,
    );

    // Wait a bit for Firefox to register the mouse position
    await page.waitForTimeout(300);
  }

  // Now try hover
  await label.hover({ force: true });

  // Give Firefox more time to process the hover state
  await page.waitForTimeout(500);

  const dropDownMenu = label.getByLabel('Conversation actions');
  await dropDownMenu.waitFor({ timeout: 10000 });
  await dropDownMenu.click();
  await page.getByRole('menuitem', { name: 'Löschen' }).click();
  await waitForToast(page);
}
