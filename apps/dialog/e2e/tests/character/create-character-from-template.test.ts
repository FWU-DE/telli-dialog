import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { nanoid } from 'nanoid';

test.use({ storageState: AUTH_FILES.teacher });

test('create character from template', async ({ page }) => {
  await page.goto('/characters');

  const card = page
    .getByRole('button', { name: 'Johann Wolfgang von Goethe', exact: true })
    .first();
  await expect(card).toBeVisible();
  await card.click();
  await page.waitForURL('/characters/**');

  const copyButton = page.getByTestId('custom-chat-duplicate-button');
  await expect(copyButton).toBeVisible();
  await expect(copyButton).toBeEnabled();
  await copyButton.click();
  await page.waitForURL('**?create=true**');

  const name = 'Johann Wolfgang von Goethe ' + nanoid(8);
  await page.getByTestId('character-name-input').fill(name);
  await page.getByTestId('character-initial-message-input').fill('Hallo');
  await page.goto('/characters');
  await expect(page.locator('body')).toContainText(name);
});
