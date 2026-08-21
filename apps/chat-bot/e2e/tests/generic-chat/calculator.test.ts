import { errors, expect, test, Page } from '@playwright/test';
import { AUTH_FILES, buildMockLlmCommand } from '../../utils/const';
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

test.describe('calculator protocol', () => {
  const cases = [
    { name: 'addition', expression: '123 + 456', expected: '579' },
    { name: 'multiple functions', expression: 'sqrt(81) + abs(-4)', expected: '13' },
    { name: 'too complex', expression: '2 ^ 1001', expected: 'EXPRESSION_TOO_COMPLEX' },
    {
      name: 'unavailable function',
      expression: 'derivative(x^2)',
      expected: 'FUNCTION_NOT_ALLOWED',
    },
  ];

  for (const { name, expression, expected } of cases) {
    test(name, async ({ page }) => {
      const response = await askCalculator(
        page,
        buildMockLlmCommand({ tool: 'calculate', arguments: { expression } }),
      );
      await expect(response).toContainText('Berechnungsergebnis');
      await expect(response).toContainText(expected);
    });
  }
});
