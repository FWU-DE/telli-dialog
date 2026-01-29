import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { sendMessage } from '../../utils/chat';

test('teacher can provide link and it is displayed in the chat', async ({ page }) => {
  await login(page, 'teacher');
  await sendMessage(
    page,
    'Wann hatte der Barock seinen Anfang?\nhttps://www.planet-wissen.de/geschichte/neuzeit/barock/index.html',
  );

  await expect(page.getByLabel('assistant message 1')).toBeVisible();
  await expect(page.getByLabel('assistant message 1')).toContainText('17');
});

test.describe('links in chat', () => {
  ([['https://www.bravo.de/'], ['https://openmoji.org/library/']] as const).forEach(([link]) => {
    test(`provide link to complex website does not timeout (${link})`, async ({ page }) => {
      await login(page, 'teacher');
      await sendMessage(
        page,
        `Gib mir eine Zusammenfassung in einem Satz dieser Seite:\n${link} Beende die Antwort mit "ENDE".`,
      );

      await expect(page.getByLabel('assistant message 1')).toBeVisible();
      await expect(page.getByLabel('assistant message 1')).toContainText('ENDE');
    });
  });
});
