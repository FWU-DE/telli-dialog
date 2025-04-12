import { test, expect } from '@playwright/test';
import { login } from '../utils/login';

test('teacher can login, create a custom gpt and start a chat', async ({ page }) => {
  await login(page, 'teacher');

  await page.goto('/custom');
  await page.waitForURL('/custom');

  const createButton = page.getByRole('button', { name: 'Neue erstellen' });
  await expect(createButton).toBeVisible();
  await createButton.click();

  await page.waitForURL('/custom/editor/**');

  // configure form
  await page.getByRole('textbox', { name: '* Wie soll diese' }).click();
  await page.getByRole('textbox', { name: '* Wie soll diese' }).fill('Hausbauplaner');
  await page.getByRole('textbox', { name: '* Wie soll diese' }).press('Tab');
  await page
    .getByRole('textbox', { name: '* Wie kann ihr Zweck kurz' })
    .fill('Hilft bei der Planung und Budget Rechnung beim Bau eines Einfamilienhauses');
  await page.getByRole('textbox', { name: '* Wie kann ihr Zweck kurz' }).press('Tab');
  await page.getByRole('button', { name: 'Bild hochladen' }).press('Tab');
  await page
    .getByRole('textbox', { name: 'Unterrichtsplanner hilft' })
    .fill('Die Währung ist US-Dollar, du berätst mich inwiefern sind ein Bausparkredit lohnt');
  await page.getByRole('textbox', { name: 'Unterrichtsplanner hilft' }).press('Tab');

  // first Prompt Suggestion Box
  await page
    .getByRole('textbox', { name: 'Erstelle einen' })
    .fill('Was kostet ein Grundstück in München?');

  // fill three more Suggestions and delete one of them afterwards
  await page.getByRole('textbox', { name: 'Erstelle einen' }).press('Tab');
  await page
    .getByRole('group')
    .filter({ hasText: 'Was soll die Spezialanwendung' })
    .getByRole('button')
    .click();
  await page
    .locator('textarea[name="promptSuggestions\\.1\\.content"]')
    .fill('Wie kann man den Bau am besten finanzieren');
  await page.getByRole('button').filter({ hasText: /^$/ }).nth(3).click();
  await page
    .locator('textarea[name="promptSuggestions\\.2\\.content"]')
    .fill('Was ist das aktuelle Zinsniveau');
  await page
    .getByRole('group')
    .filter({ hasText: 'Was soll die Spezialanwendung' })
    .getByRole('button')
    .first()
    .click();
  await page
    .locator('textarea[name="promptSuggestions\\.3\\.content"]')
    .fill('Wo kann man günstig Baugrund erwerben');

  // delete one suggestion again
  await page
    .getByRole('group')
    .filter({ hasText: 'Was soll die Spezialanwendung' })
    .getByRole('button')
    .nth(1)
    .click();

  const submitButton = await page.getByRole('button', { name: 'Neue erstellen' });
  await expect(submitButton).toBeVisible();
  await submitButton.click();

  await page.waitForURL('/custom/**');
  await page
    .getByRole('link', { name: 'Hausbauplaner Hilft bei der' })
    .getByLabel('Neuer Chat')
    .click();
  await page.waitForURL('/custom/d/**')
  await expect(page.getByRole('heading')).toContainText('Hausbauplaner');
  await expect(page.locator('body')).toContainText(
    'Hilft bei der Planung und Budget Rechnung beim Bau eines Einfamilienhauses',
  );
  await expect(page.locator('body')).toContainText('Was kostet ein Grundstück in München?');
  await expect(page.locator('body')).toContainText('Was ist das aktuelle Zinsniveau');
  await expect(page.locator('body')).toContainText('Wo kann man günstig Baugrund erwerben');
  await page.getByRole('textbox', { name: 'Wie kann ich Dir helfen?' }).click();
  await page.getByRole('textbox', { name: 'Wie kann ich Dir helfen?' }).fill('Wer bist du?');
  await page.getByLabel('Send Message').click();
  await page.getByTitle('Kopieren').click();

  await expect(page.getByLabel('assistant message 1')).toContainText('Hausbauplaner');
});

test('teacher can delete customgpt with chat', async ({ page }) => {
  await login(page, 'teacher');

  await page.goto('/custom?visibility=private');
  await page.waitForURL('/custom?visibility=private');

  const deleteChatButton = page.locator('#destructive-button').first();
  await expect(deleteChatButton).toBeVisible();
  await deleteChatButton.click();

  const deleteChatConfirmButton = page.getByRole('button', {
    name: 'Löschen',
  });
  await expect(deleteChatConfirmButton).toBeVisible();
  await deleteChatConfirmButton.click();
});
