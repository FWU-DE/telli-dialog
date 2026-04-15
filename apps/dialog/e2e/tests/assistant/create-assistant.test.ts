import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { waitForToast } from '../../utils/utils';
import { sendMessage, uploadFile } from '../../utils/chat';
import { deleteAssistant } from '../../utils/assistant';

test.use({ storageState: AUTH_FILES.teacher });

const assistantName = 'Hausbauplaner';

test('teacher can login, create an assistant and start a chat', async ({ page }) => {
  await page.goto('/assistants');
  await page.waitForURL('/assistants');

  const createButton = page.getByRole('button', { name: 'Assistent erstellen' });
  await expect(createButton).toBeVisible();
  await createButton.click();

  await page.waitForURL('/assistants/editor/**');

  // configure form
  await page.getByTestId('assistant-name-input').click();
  await page.getByTestId('assistant-name-input').fill(assistantName);
  await page.getByTestId('assistant-name-input').press('Tab');
  await page
    .getByTestId('assistant-description-input')
    .fill('Hilft bei der Planung und Budget Rechnung beim Bau eines Einfamilienhauses');

  await page
    .getByTestId('assistant-instructions-input')
    .fill('Die Währung ist US-Dollar, du berätst mich inwiefern sind ein Bausparkredit lohnt');

  // first Prompt Suggestion Box
  await page.getByTestId('prompt-suggestion-1-input').fill('Was kostet ein Grundstück in München?');
  await page.getByTestId('add-prompt-suggestion-1-button').click();

  // fill three more Suggestions and delete one of them afterwards
  await page
    .getByTestId('prompt-suggestion-2-input')
    .fill('Dieser Promptvorschlag wird wieder gelöscht.');
  await page.getByTestId('add-prompt-suggestion-2-button').click();
  await page.getByTestId('prompt-suggestion-3-input').fill('Was ist das aktuelle Zinsniveau');
  await page.getByTestId('add-prompt-suggestion-3-button').click();
  await page.getByTestId('prompt-suggestion-4-input').fill('Wo kann man günstig Baugrund erwerben');

  // delete one suggestion again
  await page.getByTestId('delete-prompt-suggestion-2-button').click();

  // save form
  await page.getByTestId('custom-chat-save-button').first().click();
  await page.goto('/assistants');

  const card = page.getByRole('button', { name: assistantName }).first();
  await expect(card).toBeVisible({ timeout: 15000 });
  await card.getByRole('button', { name: 'Neuer Chat' }).click();
  await page.waitForURL('/assistants/d/**');
  await expect(page.getByRole('heading')).toContainText(assistantName);
  await expect(page.locator('body')).toContainText(
    'Hilft bei der Planung und Budget Rechnung beim Bau eines Einfamilienhauses',
  );
  await expect(page.locator('body')).toContainText('Was kostet ein Grundstück in München?');
  await expect(page.locator('body')).toContainText('Was ist das aktuelle Zinsniveau');
  await expect(page.locator('body')).toContainText('Wo kann man günstig Baugrund erwerben');
  await sendMessage(page, 'Wer bist du?');

  await expect(page.getByLabel('assistant message 1')).toContainText(assistantName);

  await uploadFile(page, './e2e/fixtures/file-upload/Große Text Datei.txt');
  await sendMessage(page, 'Gib "OK" aus.');
  await expect(page.getByLabel('assistant message 2')).toBeVisible();
});

test('teacher can delete assistant with chat', async ({ page }) => {
  await page.goto('/assistants?visibility=private');
  await page.waitForURL('/assistants?visibility=private');

  await deleteAssistant(page, assistantName);

  await page.getByTestId('custom-chat-confirm-button').first().click();
  await waitForToast(page, 'Der Assistent wurde erfolgreich gelöscht.');
  await page.waitForURL('/assistants**');
  await expect(page.getByRole('heading', { name: assistantName }).first()).not.toBeVisible();
});

test('data is autosaved on blur', async ({ page }) => {
  await page.goto('/assistants');
  await page.waitForURL('/assistants');

  const createButton = page.getByRole('button', { name: 'Assistent erstellen' });
  await expect(createButton).toBeVisible();
  await createButton.click();

  await page.waitForURL('/assistants/editor/**');

  // Fill out the form
  await page.getByTestId('assistant-name-input').click();
  await page.getByTestId('assistant-name-input').fill('Autosave Test GPT');
  await page.getByTestId('assistant-name-input').press('Tab');

  await page
    .getByTestId('assistant-description-input')
    .fill('Test description for autosave validation');

  await page
    .getByTestId('assistant-instructions-input')
    .fill('Test functions for autosave validation');

  // Add a prompt suggestion
  await page.getByTestId('prompt-suggestion-1-input').fill('Test prompt suggestion');

  // Save the form
  await page.getByTestId('custom-chat-save-button').first().click();

  // Navigate to assistant overview explicitly to check if data was saved correctly
  await page.goto('/assistants');
  const autosaveCard = page.getByRole('button', { name: 'Autosave Test GPT' }).first();
  await expect(autosaveCard).toBeVisible({ timeout: 15000 });
  await autosaveCard.click();
  await page.waitForURL('/assistants/editor/**');

  // change title to new value
  await page.getByTestId('assistant-name-input').fill('New Title');
  await page.getByTestId('assistant-name-input').press('Tab');
  await page.reload();
  await expect(page.getByTestId('assistant-name-input')).toHaveValue('New Title');

  // change description to new value
  const descriptionInput = page.getByTestId('assistant-description-input');
  await descriptionInput.click();
  await descriptionInput.press('ControlOrMeta+A');
  await descriptionInput.fill('New Description');
  await descriptionInput.press('Tab');
  await page.reload();
  await expect(page.getByTestId('assistant-description-input')).toHaveValue('New Description');

  // change instructions to new value
  const instructionsInput = page.getByTestId('assistant-instructions-input');
  await instructionsInput.click();
  await instructionsInput.press('ControlOrMeta+A');
  await instructionsInput.fill('New Instructions');
  await instructionsInput.press('Tab');
  await page.reload();
  await expect(page.getByTestId('assistant-instructions-input')).toHaveValue('New Instructions');

  // change prompt suggestion to new value
  const promptSuggestionInput = page.getByTestId('prompt-suggestion-1-input');
  await promptSuggestionInput.click();
  await promptSuggestionInput.press('ControlOrMeta+A');
  await promptSuggestionInput.fill('New Prompt Suggestion');
  await promptSuggestionInput.press('Tab');
  await page.reload();
  await expect(page.getByTestId('prompt-suggestion-1-input')).toHaveValue('New Prompt Suggestion');
});
