import { test, expect } from '@playwright/test';
import { login } from '../utils/login';

test('should successfully upload a file and get response about its contents', async ({ page }) => {
  await login(page, 'teacher');

  const fileInput = page.locator('input[type="file"]');
  const filePath = './e2e/fixtures/file-upload/Große Text Datei.txt';

  await fileInput.setInputFiles(filePath);
  // Wait for the upload to complete
  const uploadPromise = page.waitForResponse((response) =>
    response.url().includes('api/v1/upload-file'),
  );

  const result = await uploadPromise;
  expect(result.status()).toBe(200);

  // Verify file upload was successful
  await expect(page.locator('form').getByRole('img').nth(1)).toBeVisible();

  // Send message about file contents
  const messageInput = page.getByRole('textbox', { name: 'Wie kann ich Dir helfen?' });
  await messageInput.click();
  await messageInput.fill('Wie heißt die Hauptperson die in dieser Datei genannnt wird?');
  await page.getByRole('button', { name: 'Nachricht abschicken' }).click();

  // Wait for navigation and response
  await page.waitForURL('/d/**');

  // Verify the response contains the expected content
  await page.waitForTimeout(5000);
  const assistantMessage = page.getByLabel('assistant message').getByRole('paragraph');
  await expect(assistantMessage).toBeVisible();
  await expect(assistantMessage).toContainText('Napoleon Bonaparte');
  const dropDownMenu = page.locator('div[aria-label="Conversation actions"]').first();
  await dropDownMenu.hover({ force: true });
  await page.waitForTimeout(500);
  await dropDownMenu.click();
  await page.getByRole('menuitem', { name: 'Löschen' }).click();
});

test('should successfully upload an image and get response about its contents', async ({
  page,
}) => {
  await login(page, 'teacher');

  const fileInput = page.locator('input[type="file"]');
  const filePath = './e2e/fixtures/lazy.webp';

  await fileInput.setInputFiles(filePath);
  // Wait for the upload to complete
  const uploadPromise = page.waitForResponse((response) =>
    response.url().includes('api/v1/upload-file'),
  );

  const result = await uploadPromise;
  expect(result.status()).toBe(200);

  // Verify file upload was successful
  await expect(page.locator('form').getByRole('img').nth(1)).toBeVisible();

  // Send message about image contents
  const messageInput = page.getByRole('textbox', { name: 'Wie kann ich Dir helfen?' });
  await messageInput.click();
  await messageInput.fill('Was ist auf diesem Bild zu sehen?');
  await page.getByRole('button', { name: 'Nachricht abschicken' }).click();

  // Wait for navigation and response
  await page.waitForURL('/d/**');

  // Verify the response contains the expected content
  const assistantMessage = page.getByLabel('assistant message').getByRole('paragraph');
  await expect(assistantMessage).toBeVisible();
  // Note: You may need to adjust this expectation based on what's actually in the lazy.webp image
  await expect(assistantMessage).toContainText('Bürostuhl');

  // Clean up by deleting the conversation
  const dropDownMenu = page.locator('div[aria-label="Conversation actions"]').first();
  await dropDownMenu.hover({ force: true });
  await page.waitForTimeout(500);
  await dropDownMenu.click();
  await page.getByRole('menuitem', { name: 'Löschen' }).click();
});
