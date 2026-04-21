import { expect, Page, test } from '@playwright/test';
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
  await test.step('send message and wait for response', async () => {
    const loadingSpinner = page.getByAltText('Ladeanimation');
    await enterMessage(page, message);
    const waitForLoadingSpinner = loadingSpinner.waitFor();
    await page.keyboard.press('Enter');
    // Wait for the loading spinner to appear after sending the message
    await waitForLoadingSpinner;
    // Wait for the loading spinner to disappear, which indicates that the response has started streaming
    await loadingSpinner.waitFor({ state: 'detached', timeout: 60_000 });
    // Wait for the "reload" button to appear, which indicates that the response has finished streaming
    await page.getByLabel('Reload').waitFor({ timeout: 20_000 });
  });
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
export async function selectDifferentModel(page: Page, modelName?: string) {
  const dropdown = page.getByLabel('Select text Model Dropdown');
  await expect(dropdown).toBeVisible();

  const isDisabled = await dropdown.evaluate((el) => (el as HTMLButtonElement).disabled);
  if (isDisabled) return;

  const selectedModel = await dropdown.innerText();
  if (modelName && selectedModel.includes(modelName)) {
    // requested model is already selected
    return;
  }

  await dropdown.click();

  if (modelName) {
    const option = page.getByRole('menuitem').filter({ hasText: modelName });
    await option.click();
  } else {
    // The selected model is not listed in the dropdown
    // -> selecting the first menu item will be a different model
    const firstOption = page.getByRole('menuitem').first();
    await firstOption.click();
  }
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
