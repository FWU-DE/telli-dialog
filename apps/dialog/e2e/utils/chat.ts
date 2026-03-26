import { expect, Page } from '@playwright/test';
import { waitForToast } from './utils';

export async function regenerateMessage(page: Page) {
  await page.getByLabel('Reload').click();
  await page.getByLabel('Reload').waitFor({ state: 'hidden' });
  await page.getByLabel('Reload').waitFor();
}

export async function enterMessage(page: Page, message: string) {
  await page.getByPlaceholder('Wie kann ich Dir helfen?').fill(message);
}

export async function sendMessage(page: Page, message: string) {
  await enterMessage(page, message);
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

/** Opens the LLM model dropdown and selects the first available alternative model. */
export async function selectDifferentModel(page: Page) {
  const dropdown = page.getByLabel('Select text Model Dropdown');
  await expect(dropdown).toBeVisible();

  const isDisabled = await dropdown.evaluate((el) => (el as HTMLButtonElement).disabled);
  if (isDisabled) return;

  await dropdown.click();

  // The selected model is not listed in the dropdown
  // -> selecting the first menu item will be a different model
  const firstOption = page.getByRole('menuitem').first();
  await expect(firstOption).toBeVisible();
  await firstOption.click();
}

/**
 * This function does not work reliably in firefox, likely due to a known issue with
 * Playwright and firefox where hover actions are not properly registered.
 */
export async function deleteChat(page: Page, conversationId: string) {
  const listItem = page.locator(`li:has(a[href="/d/${conversationId}"])`).first();

  // Ensure element is in viewport
  await listItem.scrollIntoViewIfNeeded();
  await expect(listItem).toBeVisible();

  await listItem.hover();

  const dropDownMenu = listItem.getByTestId('conversation-actions');
  await expect(dropDownMenu).toBeVisible();
  await dropDownMenu.click();

  await page.getByTestId('delete-conversation').click();
  await waitForToast(page);
}
