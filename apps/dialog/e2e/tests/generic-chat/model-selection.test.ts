import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { enterMessage, selectDifferentModel } from '../../utils/chat';

test.use({ storageState: AUTH_FILES.teacher });

test('switching LLM model preserves the typed prompt in generic chat', async ({ page }) => {
  await page.goto('/');

  const prompt = 'This prompt must not disappear when changing models';
  await enterMessage(page, prompt);

  await selectDifferentModel(page);

  await expect(page.getByPlaceholder('Wie kann ich Dir helfen?')).toHaveValue(prompt);
});

test('Starting a new chat clears the prompt and resets the page when already on home page', async ({
  page,
}) => {
  await page.goto('/');

  const prompt = 'Prompt that should be cleared on new chat';
  await enterMessage(page, prompt);

  // Start a new chat when already on the home page (/)
  await page.getByLabel('Hauptnavigation').getByText('Neuer Chat').click();

  // The prompt should be gone after the page resets
  await expect(page.getByPlaceholder('Wie kann ich Dir helfen?')).toHaveValue('');
});
