import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { nanoid } from 'nanoid';

test('create learning scenario from template', async ({ page }) => {
  await login(page, 'teacher');
  await page.goto('/learning-scenarios');

  const card = page.getByRole('button', { name: 'Lern was über KI' }).first();
  await expect(card).toBeVisible();
  await card.click();
  await page.waitForURL('/learning-scenarios/editor/**');

  const copyButton = page.getByRole('button', { name: 'Lernszenario bearbeiten' });
  await expect(copyButton).toBeVisible();
  await expect(copyButton).toBeEnabled();
  await copyButton.click();
  await page.waitForURL('**?create=true**');

  const name = 'Kopiertes Lernszenario ' + nanoid(8);
  await page.getByLabel('Name des Lernszenarios').fill(name);

  // Fill in other required fields (the new form auto-saves)
  await page.getByLabel('Kurzbeschreibung').fill('Beschreibung');
  await page.getByLabel('Instruktionen').fill('Instruktionen');
  await page.getByLabel('Arbeitsauftrag').fill('Arbeitsauftrag');

  // Wait for autosave to complete
  await page.waitForTimeout(500);
  await expect(page.getByText('Gespeichert')).toBeVisible({ timeout: 5000 });

  // Navigate back to learning scenarios list to verify creation
  await page.goto('/learning-scenarios?visibility=private');
  await expect(page.locator('body')).toContainText(name);
});
