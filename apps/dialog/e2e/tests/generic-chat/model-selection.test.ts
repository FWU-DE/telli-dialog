import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { selectDifferentModel } from '../../utils/chat';

test('switching LLM model preserves the typed prompt in generic chat', async ({ page }) => {
  await login(page, 'teacher');

  const prompt = 'This prompt must not disappear when changing models';
  await page.getByPlaceholder('Wie kann ich Dir helfen?').fill(prompt);

  const switched = await selectDifferentModel(page);
  test.skip(!switched, 'Only one model available – model switching not testable');

  // The input value must be unchanged after the model switch
  await expect(page.getByPlaceholder('Wie kann ich Dir helfen?')).toHaveValue(prompt);
});

test('"Neuer Chat" button clears the prompt and resets the page when already on home page', async ({
  page,
}) => {
  await login(page, 'teacher');

  const prompt = 'Prompt that should be cleared on new chat';
  await page.getByPlaceholder('Wie kann ich Dir helfen?').fill(prompt);

  // Verify prompt is typed
  await expect(page.getByPlaceholder('Wie kann ich Dir helfen?')).toHaveValue(prompt);

  // Click "Neuer Chat" — while already on the home page (/)
  await page.getByLabel('Neuer Chat').click();

  // The prompt should be gone after the page resets
  await expect(page.getByPlaceholder('Wie kann ich Dir helfen?')).toHaveValue('');
});
