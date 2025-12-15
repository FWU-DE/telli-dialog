import { expect, test } from '@playwright/test';
import { login } from '../utils/login';
import { sendMessage } from '../utils/chat';

test('can login as teacher and send a message', async ({ page }) => {
  await login(page, 'teacher');

  // send first message
  await sendMessage(page, 'Wieviel ist 2+2?');
  await expect(page.getByLabel('assistant message 1')).toContainText('4');

  // send second message
  await sendMessage(page, 'Wieviel ist 3+3?');
  await expect(page.getByLabel('assistant message 2')).toBeVisible();
});
