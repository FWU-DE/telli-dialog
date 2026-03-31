import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { sendMessage, uploadFile } from '../../utils/chat';

test('should upload file and chat with custom GPT template (Schulorganisationsassistent)', async ({
  page,
}) => {
  await login(page, 'teacher');

  await page.goto('/custom?filter=official');
  await page.waitForURL('/custom?filter=official');

  // Wait for the Schulorganisationsassistent template card and click the chat button
  const card = page.getByRole('button', { name: 'Schulorganisationsassistent' }).first();
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Neuer Chat' }).click();

  // Wait for the assistant chat page to load
  await page.waitForURL('/assistants/d/**');
  await expect(page.getByRole('heading')).toContainText('Schulorganisationsassistent');

  // Upload a file
  await uploadFile(page, './e2e/fixtures/file-upload/Große Text Datei.txt');

  // Verify file upload was successful
  await expect(page.locator('form').getByRole('img').nth(1)).toBeVisible();

  // Send message about file contents
  await sendMessage(page, 'Wie heißt die Hauptperson die in dieser Datei genannnt wird?');

  // Verify the response contains expected content
  const assistantMessage = page.getByLabel('assistant message 1');
  await expect(assistantMessage).toBeVisible();
  await expect(assistantMessage).toContainText('Napoleon Bonaparte');
});
