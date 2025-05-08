import { test, expect } from '@playwright/test';
import { login } from '../utils/login';

test('teacher can provide link and it is displayed in the chat', async ({ page }) => {
  await login(page, 'teacher');
  await page.getByRole('textbox', { name: 'Wie kann ich Dir helfen?' }).click();
  await page
    .getByRole('textbox', { name: 'Wie kann ich Dir helfen?' })
    .fill(
      'In welchem Jahr wurde der Artikel verfasst?\nhttps://www.planet-wissen.de/geschichte/neuzeit/barock/index.html',
    );
  await page.getByRole('button', { name: 'Send Message' }).click();
  await expect(page.getByLabel('assistant message 1')).toBeVisible();
  await expect(page.getByLabel('assistant message 1')).toContainText('2015');
  const sourceTitle = page.getByLabel('Source Title 0 0');
  await expect(sourceTitle).toBeVisible();
  await expect(sourceTitle).toContainText('Das Zeitalter des Barock');
  const sourceHostname = page.getByLabel('Source Hostname 0 0');
  await expect(sourceHostname).toBeVisible();
  await expect(sourceHostname).toContainText('planet-wissen.de');
});
