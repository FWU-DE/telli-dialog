import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { sendMessage } from '../../utils/chat';

test('teacher can create shared chat with web sources, student can join chat and reference web sources', async ({
  page,
}) => {
  await login(page, 'teacher');

  await page.goto('/shared-chats');
  await page.waitForURL('/shared-chats');
  await page.getByRole('button', { name: 'Szenario erstellen' }).click();
  await page.waitForURL('/shared-chats/**');

  // configure form
  await page
    .getByLabel('Wie heißt das Szenario? *')
    .fill('Analyse des Nahostkonflikts – Gruppe 1 Vermittler');

  await page
    .getByLabel('Wie kann das Szenario kurz beschrieben werden?')
    .fill('Konfliktanalyse und Lösungsansätze im Nahostkonflikt');

  await page.getByLabel('Schultyp').fill('Gymnasium');
  await page.getByLabel('Klassenstufe').fill('11. Klasse');
  await page.getByLabel('Fach').fill('Politik');

  await page
    .getByLabel('Wie lautet der Auftrag an die Lernenden?')
    .fill(
      'Schüler sollen die Ursachen, den Verlauf und mögliche Lösungsansätze des Nahostkonflikts analysieren.',
    );

  await page
    .getByLabel('Wie verhält sich telli im Lernszenario? *')
    .fill(
      'Der Chatbot soll aus der Perspektive eines neutralen Vermittlers im Nahostkonflikt antworten und verschiedene Sichtweisen beleuchten.',
    );

  await page
    .getByRole('textbox', { name: 'URL der Webseiten' })
    .fill(
      'https://www.dw.com/de/trump-im-israel-iran-konflikt-kurs-ohne-klare-linie-donald-trump-benjamin-netanjahu-atomwaffen-v2/a-72936043',
    );
  await page.getByRole('button', { name: 'Link hinzufügen' }).click();

  const submitButton = page.getByRole('button', { name: 'Szenario erstellen' });

  await expect(submitButton).toBeVisible();
  await submitButton.click();

  const firstSharedChat = page.getByRole('link', { name: 'Analyse des Nahostkonflikts' }).first();
  await expect(firstSharedChat).toBeVisible();
  await firstSharedChat.click();

  await page.waitForURL('/shared-chats/**');
  const stopSharingButton = page.getByRole('button', { name: 'Stop' });
  if (await stopSharingButton.isVisible()) {
    await stopSharingButton.click();
  }
  await page.getByTitle('Szenario starten').click();

  // enter chat directly as a teacher
  await page.getByRole('link', { name: 'Chat öffnen' }).click();
  const schoolChatPagePromise = page.waitForEvent('popup');
  const schoolChatPage = await schoolChatPagePromise;
  await schoolChatPage.getByLabel('profileDropdown').waitFor();

  // send first message
  const button = schoolChatPage.getByRole('button', { name: 'Dialog starten' });
  await button.waitFor();
  await button.click();
  await sendMessage(
    schoolChatPage,
    'Was berichtete der Reporter Bret Baier nach einem Gespräch mit US-Präsident Trump? Beende die Antwort mit "ENDE".',
  );

  await expect(schoolChatPage.getByLabel('assistant message 1')).toContainText('ENDE');
});
