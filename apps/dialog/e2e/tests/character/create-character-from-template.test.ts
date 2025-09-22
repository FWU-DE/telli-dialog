import { test, expect } from '@playwright/test';
import { login } from '../../utils/login';

test('create character from template', async ({ page }) => {
  await login(page, 'teacher');
  await page.goto('/characters?visibility=global');
  const link = page
    .getByRole('link', { name: 'Johann Wolfgang von Goethe' })
  const copyButton = link
    .getByRole('button', { name: 'Kopieren' });

  expect(link).toBeVisible();
  expect(copyButton).toBeVisible();
  expect(copyButton).toBeEnabled();
  await copyButton.click();
  await page.waitForURL('/characters/editor/**');
  await page
    .getByLabel('Wie heißt die Rolle/Simulierte Person? *')
    .fill('Johann Wolfgang von Goethe Individuell');
  await page.getByRole('textbox', { name: 'Schultyp' }).click();
  await page.getByRole('textbox', { name: 'Schultyp' }).fill('Gymnasium');
  await page.getByRole('textbox', { name: 'Schultyp' }).press('Tab');
  await page.getByRole('textbox', { name: 'Klassenstufe' }).fill('7. Klasse');
  await page.getByRole('textbox', { name: 'Klassenstufe' }).press('Tab');
  await page.getByRole('textbox', { name: 'Fach' }).fill('Geschichte');
  await page.getByRole('button', { name: 'Dialogpartner erstellen' }).click();
  await page.waitForURL('/characters?visibility=private');
  await expect(page.locator('body')).toContainText('Johann Wolfgang von Goethe Individuell');
});
