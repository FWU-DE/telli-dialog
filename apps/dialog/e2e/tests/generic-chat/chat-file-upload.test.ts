import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { deleteChat, selectDifferentModel, sendMessage, uploadFile } from '../../utils/chat';
import path from 'path';

const modelWithImageSupport = 'GPT-5 nano';

test.use({ storageState: AUTH_FILES.teacher });

test('should successfully upload a file and get response about its contents', async ({ page }) => {
  await page.goto('/');

  await uploadFile(page, './e2e/fixtures/file-upload/Große Text Datei.txt');

  // Verify file upload was successful
  await expect(page.locator('form').getByRole('img').nth(1)).toBeVisible();

  // Send message about file contents
  await sendMessage(page, 'Wie heißt die Hauptperson die in dieser Datei genannt wird?');

  // Verify the response contains the expected content
  const assistantMessage = page.getByLabel('assistant message 1');
  await expect(assistantMessage).toBeVisible();
  await expect(assistantMessage).toContainText('Napoleon Bonaparte');

  // Clean up by deleting the conversation
  await deleteChat(page, path.basename(page.url()));
});

test('should successfully upload an image and get response about its contents', async ({
  page,
}) => {
  await page.goto('/');
  await selectDifferentModel(page, modelWithImageSupport);

  await uploadFile(page, './e2e/fixtures/lazy.webp');

  // Verify file upload was successful
  await expect(page.locator('form').getByRole('img').nth(1)).toBeVisible();

  // Send message about image contents
  await sendMessage(page, 'Was ist auf diesem Bild zu sehen? Beende die Antwort mit "ENDE".');

  // Verify the response contains the expected content
  const assistantMessage = page.getByLabel('assistant message 1');
  await expect(assistantMessage).toBeVisible();
  // Note: You may need to adjust this expectation based on what's actually in the lazy.webp image
  await expect(assistantMessage).toContainText('ENDE');
  await expect(assistantMessage).toContainText(/stuhl|tisch|person|blau/i);

  // Clean up by deleting the conversation
  await deleteChat(page, path.basename(page.url()));
});
