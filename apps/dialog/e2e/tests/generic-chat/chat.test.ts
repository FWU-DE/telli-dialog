import { test, expect } from '@playwright/test';
import { login } from '../../utils/login';

test('should successfully regenerate a response', async ({ page }) => {
  await login(page, 'teacher');

  const messageInput = page.getByRole('textbox', { name: 'Wie kann ich Dir helfen?' });
  await messageInput.click();
  await messageInput.fill('Schreibe "OK" und eine Zufallszahl von 0 bis 1.000.000');
  await page.getByRole('button', { name: 'Nachricht abschicken' }).click();

  // Wait for navigation and response
  await page.waitForURL('/d/**');

  // Verify the response contains the expected content
  const assistantMessage = page.getByLabel('assistant message 1').getByRole('paragraph');
  await expect(assistantMessage).toBeVisible();
  await expect(assistantMessage).toContainText('OK');
  const text = await page.getByLabel('assistant message 1').innerText();

  // regenerate last message
  await page.getByLabel('Reload').click();

  await page.waitForURL('/d/**');

  await page.getByLabel('Reload').waitFor();
  await expect(page.getByLabel('assistant message 1')).toContainText('OK');
  const regeneratedText = await page.getByLabel('assistant message 1').innerText();
  expect(regeneratedText).not.toBe(text);
});

test('should copy response to clipboard', async ({ page }) => {
  await login(page, 'teacher');

  const messageInput = page.getByRole('textbox', { name: 'Wie kann ich Dir helfen?' });
  await messageInput.click();
  await messageInput.fill('Schreibe "OK"');
  await page.getByRole('button', { name: 'Nachricht abschicken' }).click();

  await page.waitForURL('/d/**');

  const assistantMessage = page.getByLabel('assistant message 1').getByRole('paragraph');
  await expect(assistantMessage).toBeVisible();

  await page.getByTitle('Kopieren').click();
  const text = await assistantMessage.innerText();
  const clipboardContent = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardContent).toBe(text);
});
