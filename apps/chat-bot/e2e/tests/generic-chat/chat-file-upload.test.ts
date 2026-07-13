import { expect, test } from '@playwright/test';
import { AUTH_FILES, MOCK_LLM_COMMANDS } from '../../utils/const';
import { deleteChat, sendMessage, uploadFile } from '../../utils/chat';
import { SUPPORTED_FILE_EXTENSIONS } from '@/const';
import path from 'path';

test.use({ storageState: AUTH_FILES.teacher });

test('should successfully upload a file and get response about its contents', async ({ page }) => {
  await page.goto('/');

  await uploadFile(page, './e2e/fixtures/file-upload/Große Text Datei.txt');

  // Verify file upload was successful
  await expect(page.locator('form').getByRole('img').nth(1)).toBeVisible();

  // Send message about file contents
  await sendMessage(
    page,
    `${MOCK_LLM_COMMANDS.CALL_RETRIEVE_ENTIRE_FILE} Wie heißt die Hauptperson die in dieser Datei genannt wird?`,
  );

  // Verify the response contains the expected content
  const assistantMessage = page.getByLabel('assistant message 1');
  await expect(assistantMessage).toBeVisible();
  // 'Napoleon Bonaparte' is written in the uploaded file, which the mock LLM retrieves via tool call.
  await expect(assistantMessage).toContainText(/Napol[eé]on Bonaparte/i);

  // Clean up by deleting the conversation
  await deleteChat(page, path.basename(page.url()));
});

test('should successfully upload each supported file type and receive an assistant response', async ({
  page,
}) => {
  await page.goto('/');

  for (let i = 0; i < SUPPORTED_FILE_EXTENSIONS.length; i++) {
    const file = `sample.${SUPPORTED_FILE_EXTENSIONS[i]}`;

    await test.step(`File ${file}`, async () => {
      await uploadFile(page, `./e2e/fixtures/file-upload/${file}`);

      // Verify file upload was successful
      await expect(page.locator('form').getByRole('img').nth(1)).toBeVisible();

      await sendMessage(page, `Was ist der Inhalt der Datei "${file}"?`);

      // Verify an assistant message is returned for this upload
      const assistantMessage = page.getByLabel(`assistant message ${i + 1}`);
      await expect(assistantMessage).toBeVisible();
    });
  }

  // Clean up by deleting the conversation
  await deleteChat(page, path.basename(page.url()));
});
