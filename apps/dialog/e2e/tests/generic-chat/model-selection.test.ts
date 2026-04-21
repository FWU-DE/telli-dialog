import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { selectDifferentModel } from '../../utils/chat';
import { LLM_MODELS } from '../../utils/llm-models';

test.use({ storageState: AUTH_FILES.teacher });

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage({ storageState: AUTH_FILES.teacher });

  try {
    // restore default text model
    await page.goto('/');
    await selectDifferentModel(page, LLM_MODELS.TEXT_MODEL_1);
  } finally {
    await page.close();
  }
});

test('switching LLM model preserves the typed prompt in generic chat', async ({ page }) => {
  await page.goto('/');

  const prompt = 'This prompt must not disappear when changing models';
  await page.getByPlaceholder('Wie kann ich Dir helfen?').fill(prompt);

  // Switch to the second model
  await selectDifferentModel(page, LLM_MODELS.TEXT_MODEL_2);

  // Verify prompt is preserved
  await expect(page.getByPlaceholder('Wie kann ich Dir helfen?')).toHaveValue(prompt);
});

test('Starting a new chat clears the prompt and resets the page when already on home page', async ({
  page,
}) => {
  await page.goto('/');

  const prompt = 'Prompt that should be cleared on new chat';
  await page.getByPlaceholder('Wie kann ich Dir helfen?').fill(prompt);

  // Start a new chat when already on the home page (/)
  await page.getByLabel('Hauptnavigation').getByText('Neuer Chat').click();

  // The prompt should be gone after the page resets
  await expect(page.getByPlaceholder('Wie kann ich Dir helfen?')).toHaveValue('');
});
