import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { sendMessage } from '../../utils/chat';

test.use({ storageState: AUTH_FILES.teacher });

test('teacher can provide link and it is displayed in the chat', async ({ page }) => {
  await page.goto('/');
  await sendMessage(
    page,
    'Wann hatte der Barock seinen Anfang?\nhttps://www.planet-wissen.de/geschichte/neuzeit/barock/index.html',
  );

  await expect(page.getByTestId('citation').first()).toContainText('planet-wissen.de');
  await expect(page.getByLabel('assistant message 1')).toBeVisible();
  await expect(page.getByLabel('assistant message 1')).toContainText('17');
});

test.describe('links in chat', () => {
  (
    [
      ['https://www.bravo.de/', 'bravo.de'],
      ['https://openmoji.org/library/', 'openmoji.org'],
    ] as const
  ).forEach(([link, host]) => {
    test(`provide link to complex website does not timeout (${link})`, async ({ page }) => {
      await page.goto('/');
      await sendMessage(
        page,
        `Gib mir eine Zusammenfassung in einem Satz dieser Seite:\n${link} Beende die Antwort mit "ENDE".`,
      );

      await expect(page.getByTestId('citation').first()).toContainText(host);
      await expect(page.getByLabel('assistant message 1')).toBeVisible();
      await expect(page.getByLabel('assistant message 1')).toContainText('ENDE');
    });
  });
});
