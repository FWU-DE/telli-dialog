import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { nanoid } from 'nanoid';

test('create character from template', async ({ page }) => {
  await login(page, 'teacher');
  await page.goto('/characters');

  const card = page
    .getByRole('button', { name: 'Johann Wolfgang von Goethe', exact: true })
    .first();
  await expect(card).toBeVisible();
  await card.click();
  await page.waitForURL('/characters/editor/**');

  const copyButton = page.getByRole('button', { name: 'Dialogpartner bearbeiten' });
  await expect(copyButton).toBeVisible();
  await expect(copyButton).toBeEnabled();
  await copyButton.click();
  await page.waitForURL('**?create=true**');

  const name = 'Johann Wolfgang von Goethe ' + nanoid(8);
  await page.getByLabel('Wie heißt die simulierte Person? *').fill(name);
  await page.getByRole('textbox', { name: 'Schultyp' }).click();
  await page.getByRole('textbox', { name: 'Schultyp' }).fill('Gymnasium');
  await page.getByRole('textbox', { name: 'Schultyp' }).press('Tab');
  await page.getByRole('textbox', { name: 'Klassenstufe' }).fill('7. Klasse');
  await page.getByRole('textbox', { name: 'Klassenstufe' }).press('Tab');
  await page.getByRole('textbox', { name: 'Fach' }).fill('Geschichte');
  await page.getByRole('button', { name: 'Dialogpartner erstellen' }).click();
  await page.waitForURL('/characters?visibility=private');
  await expect(page.locator('body')).toContainText(name);
});
