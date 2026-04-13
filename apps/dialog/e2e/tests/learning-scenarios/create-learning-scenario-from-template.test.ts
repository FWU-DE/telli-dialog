import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { nanoid } from 'nanoid';

test('create learning scenario from template', async ({ page }) => {
  await login(page, 'teacher');
  await page.goto('/learning-scenarios');

  const card = page.getByRole('button', { name: 'Lern was über KI' }).first();
  await expect(card).toBeVisible();
  await card.click();
  // Non-owned scenarios now route to read-only view instead of editor
  await page.waitForURL('/learning-scenarios/**');

  const duplicateButton = page.getByRole('button', { name: 'Duplizieren' });
  await expect(duplicateButton).toBeVisible();
  await expect(duplicateButton).toBeEnabled();
  await duplicateButton.click();
  // After duplicating, should be redirected to the editor of the new scenario
  await page.waitForURL('/learning-scenarios/editor/**');

  const name = 'Kopiertes Lernszenario ' + nanoid(8);
  await page.getByRole('textbox', { name: 'Name des Lernszenarios' }).fill(name);

  // Fill in other required fields (the new form auto-saves)
  await page.getByRole('textbox', { name: 'Kurzbeschreibung' }).fill('Beschreibung');
  await page.getByRole('textbox', { name: 'Instruktionen' }).fill('Instruktionen');
  await page.getByRole('textbox', { name: 'Arbeitsauftrag' }).fill('Arbeitsauftrag');

  // Wait for autosave to complete
  await page.waitForTimeout(500);
  await expect(page.getByText('Gespeichert').first()).toBeVisible({ timeout: 5000 });

  // Navigate back to learning scenarios list to verify creation
  await page.goto('/learning-scenarios?visibility=private');
  await expect(page.locator('body')).toContainText(name);
});
