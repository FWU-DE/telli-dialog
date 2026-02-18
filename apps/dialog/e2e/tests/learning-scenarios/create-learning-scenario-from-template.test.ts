import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { nanoid } from 'nanoid';

test('create learning scenario from template', async ({ page }) => {
  await login(page, 'teacher');
  await page.goto('/learning-scenarios?visibility=global');
  const link = page.getByRole('link', { name: 'Lern was über KI' });
  const copyButton = link.getByRole('button', { name: 'Kopieren' });

  await expect(link).toBeVisible();
  await expect(copyButton).toBeVisible();
  await expect(copyButton).toBeEnabled();
  await copyButton.click();
  await page.waitForURL('/learning-scenarios/editor/**');

  const name = 'Kopiertes Lernszenario ' + nanoid(8);
  await page.getByLabel('Wie heißt das Szenario?').fill(name);

  await page.getByRole('textbox', { name: 'Schultyp' }).fill('Gymnasium');
  await page.keyboard.press('Tab');

  await page.getByRole('textbox', { name: 'Klassenstufe' }).fill('5. Klasse');
  await page.keyboard.press('Tab');

  await page.getByRole('textbox', { name: 'Fach' }).fill('Geschichte');
  await page.keyboard.press('Tab');

  await page.getByRole('button', { name: 'Szenario erstellen' }).click();
  await page.waitForURL('/learning-scenarios?visibility=private');
  await expect(page.locator('body')).toContainText(name);
});
