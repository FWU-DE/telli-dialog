import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { deleteChat, regenerateMessage, sendMessage } from '../../utils/utils';
import path from 'path';

test('should successfully regenerate a response', async ({ page }) => {
  await login(page, 'teacher');
  await sendMessage(page, 'Schreibe "OK" und eine Zufallszahl von 0 bis 1.000.000');

  // Verify the response contains the expected content
  const assistantMessage = page.getByLabel('assistant message 1');
  await expect(assistantMessage).toBeVisible();
  await expect(assistantMessage).toContainText('OK');

  // regenerate last message
  await regenerateMessage(page);
  await expect(page.getByLabel('assistant message 1')).toContainText('OK');
  const chatRequests = (await page.requests()).filter(
    (x) => x.method() === 'POST' && x.url().endsWith('/api/chat'),
  );
  expect(chatRequests).toHaveLength(2);
});

test('should copy response to clipboard', async ({ page }) => {
  await login(page, 'teacher');
  await sendMessage(page, 'Schreibe "OK"');

  const assistantMessage = page.getByLabel('assistant message 1');
  await expect(assistantMessage).toBeVisible();

  await page.getByTitle('Kopieren').click();
  const text = await assistantMessage.innerText();
  const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardContent).toBe(text);
});

test('should successfully delete the current chat', async ({ page }) => {
  await login(page, 'teacher');
  await sendMessage(page, 'Schreibe "OK"');
  await deleteChat(page, path.basename(page.url()));

  await page.waitForURL('/');

  expect(page.url()).not.toContain('/d/');
});
