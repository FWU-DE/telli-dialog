import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { regenerateMessage } from '../../utils/utils';

test('should successfully regenerate a response', async ({ page }) => {
  await login(page, 'teacher');

  const messageInput = page.getByRole('textbox', { name: 'Wie kann ich Dir helfen?' });
  await messageInput.click();
  await messageInput.fill('Schreibe "OK" und eine Zufallszahl von 0 bis 1.000.000');
  await page.getByRole('button', { name: 'Nachricht abschicken' }).click();

  // Wait for navigation and response
  await page.getByLabel('Reload').waitFor();

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

  const messageInput = page.getByRole('textbox', { name: 'Wie kann ich Dir helfen?' });
  await messageInput.click();
  await messageInput.fill('Schreibe "OK"');
  await page.getByRole('button', { name: 'Nachricht abschicken' }).click();
  await page.getByLabel('Reload').waitFor();

  const assistantMessage = page.getByLabel('assistant message 1');
  await expect(assistantMessage).toBeVisible();

  await page.getByTitle('Kopieren').click();
  const text = await assistantMessage.innerText();
  const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardContent).toBe(text);
});
