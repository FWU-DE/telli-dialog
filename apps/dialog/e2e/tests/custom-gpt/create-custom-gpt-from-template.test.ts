import { test, expect } from '@playwright/test';
import { login } from '../../utils/login';

test('test', async ({ page }) => {
  await login(page, 'teacher');
  await page.goto('/custom?visibility=global');
  const copyButton = page.getByTitle('Kopieren').first();

  expect(copyButton).toBeVisible();
  expect(copyButton).toBeEnabled();
  await copyButton.click();

  await page.waitForURL('/custom/editor/**');
  await page
    .getByRole('textbox', { name: 'Wie soll diese' })
    .fill('Schulorganisationsassistent Individuell');
  await page
    .getByRole('textbox', { name: 'Wie kann der Assistent kurz beschrieben werden? *' })
    .click();
  await page
    .getByRole('textbox', { name: 'Wie kann der Assistent kurz beschrieben werden? *' })
    .fill('Individueller Planer für organisatorische Aufgaben an meiner Schule');
  await page.getByRole('textbox', { name: 'Welche konkreten Funktionen' }).click();
  await page
    .getByRole('textbox', { name: 'Welche konkreten Funktionen' })
    .fill('Speziell angepasst für die Bedürfnisse meiner Schule und Klassenstufen.');
  await page.getByRole('button', { name: 'Assistent erstellen' }).click();
  await page.waitForURL('/custom?visibility=private');
  await expect(page.locator('body')).toContainText('Schulorganisationsassistent Individuell');
});
