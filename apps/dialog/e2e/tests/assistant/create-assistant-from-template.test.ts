import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';

test.use({ storageState: AUTH_FILES.teacher });

test('create assistant from template', async ({ page }) => {
  await page.goto('/assistants');

  const card = page
    .getByRole('button', { name: 'Schulorganisationsassistent', exact: true })
    .first();
  await expect(card).toBeVisible({ timeout: 15000 });
  await card.click();
  await page.waitForURL('/assistants/**');

  const copyButton = page.getByTestId('custom-chat-duplicate-button').first();
  await expect(copyButton).toBeVisible({ timeout: 15000 });
  await expect(copyButton).toBeEnabled();
  await copyButton.click();
  await page.waitForURL('/assistants/editor/**');

  await page.getByTestId('assistant-name-input').fill('Schulorganisationsassistent Individuell');
  await page
    .getByTestId('assistant-description-input')
    .fill('Individueller Planer für organisatorische Aufgaben an meiner Schule');
  await page
    .getByTestId('assistant-instructions-input')
    .fill('Speziell angepasst für die Bedürfnisse meiner Schule und Klassenstufen.');
  await page.getByTestId('custom-chat-save-button').first().click();
  await page.getByTestId('assistant-edit-back-button').click();
  await page.waitForURL('/assistants**');
  await expect(page.locator('body')).toContainText('Schulorganisationsassistent Individuell');
});
