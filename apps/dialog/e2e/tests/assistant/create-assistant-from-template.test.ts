import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { configureAssistant } from '../../utils/assistant';

test.use({ storageState: AUTH_FILES.teacher });

test('create assistant from template', async ({ page }) => {
  await page.goto('/assistants');

  const card = page
    .getByTestId('entity-card')
    .filter({ hasText: 'Schulorganisationsassistent' })
    .first();
  await expect(card).toBeVisible({ timeout: 15000 });
  await card.getByTestId('entity-link').click();
  await page.waitForURL('/assistants/**');

  const copyButton = page.getByTestId('custom-chat-duplicate-button').first();
  await expect(copyButton).toBeVisible({ timeout: 15000 });
  await expect(copyButton).toBeEnabled();
  await copyButton.click();
  await page.waitForURL('/assistants/editor/**');

  await configureAssistant(page, {
    name: 'Schulorganisationsassistent Individuell',
    description: 'Individueller Planer für organisatorische Aufgaben an meiner Schule',
    instructions: 'Speziell angepasst für die Bedürfnisse meiner Schule und Klassenstufen.',
  });
  await page.getByTestId('assistant-edit-back-button').click();
  await page.waitForURL('/assistants**');
  await expect(page.locator('body')).toContainText('Schulorganisationsassistent Individuell');
});
