import { test, expect } from '@playwright/test';
import { login } from '../utils/login';

test('can login as teacher and send a message', async ({ page }) => {
  await login(page, 'teacher');

  // send first message
  await page.getByPlaceholder('Wie kann ich Dir helfen?').fill('Wieviel ist 2+2?');
  await page.getByRole('button', { name: 'Nachricht abschicken' }).click();
  await page.getByTitle('Kopieren').click();

  await expect(page.getByLabel('assistant message 1')).toContainText('4');

  // send second message
  await page.getByPlaceholder('Wie kann ich Dir helfen?').fill('Wieviel ist 3+3?');
  await page.getByRole('button', { name: 'Nachricht abschicken' }).click();

  await expect(page.getByLabel('assistant message 2')).toBeVisible();
});
