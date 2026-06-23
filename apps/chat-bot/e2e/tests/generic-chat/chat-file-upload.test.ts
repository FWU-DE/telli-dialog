import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { deleteChat, sendMessage, uploadFile } from '../../utils/chat';
import path from 'path';

test.use({ storageState: AUTH_FILES.teacher });

test('should successfully upload a file and get a response', async ({ page }) => {
  await page.goto('/');

  await uploadFile(page, './e2e/fixtures/file-upload/Große Text Datei.txt');

  // Verify file upload was successful
  await expect(page.locator('form').getByRole('img').nth(1)).toBeVisible();

  // Send a message after uploading the file
  await sendMessage(page, 'Gib "OK" aus.');

  // Verify the response is visible
  const assistantMessage = page.getByLabel('assistant message 1');
  await expect(assistantMessage).toBeVisible();
  await expect(assistantMessage).toContainText('OK');

  // Clean up by deleting the conversation
  await deleteChat(page, path.basename(page.url()));
});
