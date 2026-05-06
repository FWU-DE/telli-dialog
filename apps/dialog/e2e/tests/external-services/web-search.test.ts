import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { sendMessage } from '../../utils/chat';

test.use({ storageState: AUTH_FILES.teacher });

test('should successfully perform web search', { tag: '@external-services' }, async ({ page }) => {
  await page.goto('/');

  const websearchToggle = page.getByRole('button', { name: 'Internetquellen', exact: true });

  // send a message that does not require web search
  await sendMessage(page, 'Hallo');
  await expect(websearchToggle).not.toBeVisible();

  // send a message that requires web search
  await sendMessage(page, 'Wie ist aktuell das Wetter in Augsburg?');
  await expect(websearchToggle).toBeVisible();
});
