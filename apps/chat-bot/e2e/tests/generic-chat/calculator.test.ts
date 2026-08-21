import { errors, expect, test, Page } from '@playwright/test';
import { AUTH_FILES, MOCK_LLM_COMMANDS } from '../../utils/const';
import { deleteChat, selectDifferentModel, sendMessage } from '../../utils/chat';
import path from 'node:path';

test.use({ storageState: AUTH_FILES.teacher });

async function askCalculator(page: Page, command: string) {
  await page.goto('/');
  await selectDifferentModel(page, 'Mock LLM');
  await sendMessage(page, command);
  const assistantMessage = page.getByLabel('assistant message 1');
  await expect(assistantMessage).toBeVisible();
  return assistantMessage;
}

test.afterEach(async ({ page }) => {
  if (!/\/d\//.test(page.url())) return;

  const conversationId = path.basename(page.url());
  const conversation = page.locator(`li:has(a[href="/d/${conversationId}"])`).first();

  try {
    await conversation.waitFor({ state: 'attached', timeout: 1_000 });
  } catch (error) {
    if (error instanceof errors.TimeoutError) return;
    throw error;
  }

  await deleteChat(page, conversationId);
});

test('calculates a simple addition through the calculate tool', async ({ page }) => {
  const response = await askCalculator(page, MOCK_LLM_COMMANDS.CALL_CALCULATE_ADDITION);
  await expect(response).toContainText('Berechnungsergebnis');
  await expect(response).toContainText('579');
});

test('calculates an expression using multiple allowed functions', async ({ page }) => {
  const response = await askCalculator(page, MOCK_LLM_COMMANDS.CALL_CALCULATE_FUNCTIONS);
  await expect(response).toContainText('Berechnungsergebnis');
  await expect(response).toContainText('13');
});

test('reports when calculator computation is too complex', async ({ page }) => {
  const response = await askCalculator(page, MOCK_LLM_COMMANDS.CALL_CALCULATE_TOO_COMPLEX);
  await expect(response).toContainText('Berechnungsergebnis');
  await expect(response).toContainText('EXPRESSION_TOO_COMPLEX');
});

test('reports when a calculator function is unavailable', async ({ page }) => {
  const response = await askCalculator(page, MOCK_LLM_COMMANDS.CALL_CALCULATE_DERIVATIVE);
  await expect(response).toContainText('Berechnungsergebnis');
  await expect(response).toContainText('FUNCTION_NOT_ALLOWED');
});
