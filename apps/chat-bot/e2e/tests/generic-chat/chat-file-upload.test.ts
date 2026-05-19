import { expect, test } from '@playwright/test';
import { AUTH_FILES, MOCK_LLM_COMMANDS } from '../../utils/const';
import { deleteChat, sendMessage, uploadFile } from '../../utils/chat';
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
    `${MOCK_LLM_COMMANDS.RETURN_SYSTEM_PROMPT} Wie heißt die Hauptperson die in dieser Datei genannt wird?`,
  );

  // Verify the response contains the expected content
  const assistantMessage = page.getByLabel('assistant message 1');
  await expect(assistantMessage).toBeVisible();
  // 'Napoleon Bonaparte' is written in the uploaded file, which is added to the system prompt;
  // the mock LLM echoes the system prompt back.
  await expect(assistantMessage).toContainText(/Napol[eé]on Bonaparte/i);

  // Clean up by deleting the conversation
  await deleteChat(page, path.basename(page.url()));
});
