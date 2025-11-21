import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { sendMessage } from '../../utils/utils';

test('teacher can provide link and it is displayed in the chat', async ({ page }) => {
  await login(page, 'teacher');
  await sendMessage(
    page,
    'In welchem Jahr wurde der Artikel verfasst?\nhttps://www.planet-wissen.de/geschichte/neuzeit/barock/index.html',
  );

  await expect(page.getByLabel('assistant message 1')).toBeVisible();
  await expect(page.getByLabel('assistant message 1')).toContainText('2015');
  const sourceTitle = page.getByLabel('Source Title 0 0');
  await expect(sourceTitle).toBeVisible();
  await expect(sourceTitle).toContainText('Das Zeitalter des Barock');
  const sourceHostname = page.getByLabel('Source Hostname 0 0');
  await expect(sourceHostname).toBeVisible();
  await expect(sourceHostname).toContainText('planet-wissen.de');
});

test.describe('links in chat', () => {
  (
    [
      ['https://www.bravo.de/', 'BRAVO', 'bravo.de'],
      ['https://openmoji.org/library/', 'Library', 'openmoji.org'],
    ] as const
  ).forEach(([link, title, host]) => {
    test(`provide link to complex website does not timeout (${link})`, async ({ page }) => {
      await login(page, 'teacher');
      await sendMessage(page, `Gib mir eine Zusammenfassung in einem Satz dieser Seite:\n${link}`);

      await expect(page.getByLabel('Source Title 0 0')).toContainText(title);
      await expect(page.getByLabel('Source Hostname 0 0')).toContainText(host);
    });
  });
});
