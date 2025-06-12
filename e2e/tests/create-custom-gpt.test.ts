import { test, expect } from '@playwright/test';
import { login } from '../utils/login';

test('teacher can login, create a custom gpt and start a chat', async ({ page }) => {
  await login(page, 'teacher');

  await page.goto('/custom');
  await page.waitForURL('/custom');

  const createButton = page.getByRole('button', { name: 'Assistent erstellen' });
  await expect(createButton).toBeVisible();
  await createButton.click();

  await page.waitForURL('/custom/editor/**');

  // configure form
  await page.getByRole('textbox', { name: 'Wie soll diese' }).click();
  await page.getByRole('textbox', { name: 'Wie soll diese' }).fill('Hausbauplaner');
  await page.getByRole('textbox', { name: 'Wie soll diese' }).press('Tab');
  await page
    .getByRole('textbox', { name: 'Wie kann der Assistent kurz beschrieben werden? *' })
    .fill('Hilft bei der Planung und Budget Rechnung beim Bau eines Einfamilienhauses');

  await page
    .getByRole('textbox', { name: 'Welche konkreten Funktionen' })
    .fill('Die Währung ist US-Dollar, du berätst mich inwiefern sind ein Bausparkredit lohnt');

  // first Prompt Suggestion Box
  await page.getByPlaceholder('Erstelle einen').fill('Was kostet ein Grundstück in München?');

  // fill three more Suggestions and delete one of them afterwards
  await page.getByPlaceholder('Erstelle einen').press('Tab');
  await page
    .getByRole('group')
    .filter({ hasText: 'Welche konkreten Funktionen' })
    .getByRole('button')
    .click();
  await page
    .locator('textarea[name="promptSuggestions\\.1\\.content"]')
    .fill('Wie kann man den Bau am besten finanzieren');
  await page.getByRole('button', { name: 'Promptvorschlag hinzufügen' }).click();
  await page
    .locator('textarea[name="promptSuggestions\\.2\\.content"]')
    .fill('Was ist das aktuelle Zinsniveau');
  await page.getByRole('button', { name: 'Promptvorschlag hinzufügen' }).click();
  await page
    .locator('textarea[name="promptSuggestions\\.3\\.content"]')
    .fill('Wo kann man günstig Baugrund erwerben');

  // delete one suggestion again
  await page
    .getByRole('group')
    .filter({ hasText: 'Welche konkreten Funktionen' })
    .getByRole('button')
    .nth(1)
    .click();

  const submitButton = await page.getByRole('button', { name: 'Assistent erstellen' });
  await expect(submitButton).toBeVisible();
  await submitButton.click();

  await page.waitForURL('/custom/**');
  await page
    .getByRole('link', { name: 'Hausbauplaner Hilft bei der' })
    .getByLabel('Neuer Chat')
    .first()
    .click();
  await page.waitForURL('/custom/d/**');
  await expect(page.getByRole('heading')).toContainText('Hausbauplaner');
  await expect(page.locator('body')).toContainText(
    'Hilft bei der Planung und Budget Rechnung beim Bau eines Einfamilienhauses',
  );
  await expect(page.locator('body')).toContainText('Was kostet ein Grundstück in München?');
  await expect(page.locator('body')).toContainText('Was ist das aktuelle Zinsniveau');
  await expect(page.locator('body')).toContainText('Wo kann man günstig Baugrund erwerben');
  await page.getByRole('textbox', { name: 'Wie kann ich Dir helfen?' }).click();
  await page.getByRole('textbox', { name: 'Wie kann ich Dir helfen?' }).fill('Wer bist du?');
  await page.getByRole('button', { name: 'Nachricht abschicken' }).click();
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

test('data is autosaved on blur', async ({ page }) => {
  await login(page, 'teacher');

  await page.goto('/custom');
  await page.waitForURL('/custom');

  const createButton = page.getByRole('button', { name: 'Assistent erstellen' });
  await expect(createButton).toBeVisible();
  await createButton.click();

  await page.waitForURL('/custom/editor/**');

  // Fill out the form
  await page.getByRole('textbox', { name: 'Wie soll diese' }).click();
  await page.getByRole('textbox', { name: 'Wie soll diese' }).fill('Autosave Test GPT');
  await page.getByRole('textbox', { name: 'Wie soll diese' }).press('Tab');
  await page
    .getByRole('textbox', { name: 'Wie kann der Assistent kurz beschrieben werden? *' })
    .fill('Test description for autosave validation');

  await page
    .getByRole('textbox', { name: 'Welche konkreten Funktionen' })
    .fill('Test functions for autosave validation');

  // Add a prompt suggestion
  await page.getByPlaceholder('Erstelle einen').fill('Test prompt suggestion');
  let submitButton = await page.getByRole('button', { name: 'Assistent erstellen' });
  await expect(submitButton).toBeVisible();
  await submitButton.click();

  await page.waitForURL('/custom/**');
  await page.getByRole('link', { name: 'Autosave Test GPT' }).first().click();
  await page.waitForURL('/custom/editor/**');

  // change title to new value
  await page.getByRole('textbox', { name: 'Wie soll diese' }).fill('New Title');
  // unfocus the textbox
  await page.getByRole('textbox', { name: 'Wie soll diese' }).press('Tab');
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Wie soll diese' })).toHaveValue('New Title');

  // change description to new value
  await page
    .getByRole('textbox', { name: 'Wie kann der Assistent kurz beschrieben werden? *' })
    .fill('New Description');
  await page
    .getByRole('textbox', { name: 'Wie kann der Assistent kurz beschrieben werden? *' })
    .press('Tab');
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(
    page.getByRole('textbox', { name: 'Wie kann der Assistent kurz beschrieben werden? *' }),
  ).toHaveValue('New Description');

  // change functions to new value
  await page.getByRole('textbox', { name: 'Welche konkreten Funktionen' }).fill('New Functions');
  await page.getByRole('textbox', { name: 'Welche konkreten Funktionen' }).press('Tab');
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Welche konkreten Funktionen' })).toHaveValue(
    'New Functions',
  );

  // change prompt suggestion to new value
  await page.getByPlaceholder('Erstelle einen').fill('New Prompt Suggestion');
  await page.waitForTimeout(1000);
  await page.getByPlaceholder('Erstelle einen').press('Tab');
  await expect(page.getByPlaceholder('Erstelle einen')).toHaveValue('New Prompt Suggestion');
});

test('submit button is disabled when required fields are empty', async ({ page }) => {
  await login(page, 'teacher');

  await page.goto('/custom');
  await page.waitForURL('/custom');

  const createButton = page.getByRole('button', { name: 'Assistent erstellen' });
  await expect(createButton).toBeVisible();
  await createButton.click();

  await page.waitForURL('/custom/editor/**');

  const submitButton = page.getByRole('button', { name: 'Assistent erstellen' });
  await expect(submitButton).toBeVisible();

  // Check that submit button is disabled when all fields are empty
  await expect(submitButton).toBeDisabled();

  // Fill in only the name - button should still be disabled due to missing description
  await page.getByRole('textbox', { name: 'Wie soll diese' }).fill('Test GPT Name');
  await expect(submitButton).toBeDisabled();

  // Fill in the required description field - now button should be enabled
  await page
    .getByRole('textbox', { name: 'Wie kann der Assistent kurz beschrieben werden? *' })
    .fill('Test description');

  await expect(submitButton).toBeDisabled();
  // Fill in the required specification field - now button should be enabled
  await page.getByRole('textbox', { name: 'Welche konkreten Funktionen' }).fill('Test functions');
  await expect(submitButton).toBeEnabled();
});
