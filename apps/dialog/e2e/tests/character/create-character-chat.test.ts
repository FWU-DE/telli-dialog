import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { regenerateMessage, sendMessage } from '../../utils/chat';
import { deleteCharacter } from '../../utils/character';
import { waitForToast } from '../../utils/utils';

const characterName = 'John Cena';

test('teacher can login, create and join shared dialogpartner chat', async ({ page }) => {
  await login(page, 'teacher');

  await page.goto('/characters');
  await page.waitForURL('/characters**');

  const createButton = page.getByRole('button', { name: 'Dialogpartner erstellen' });
  await expect(createButton).toBeVisible();
  await createButton.click();

  await page.waitForURL('/characters/editor/**');

  // configure form
  await page.getByLabel('Schultyp').fill('Gymnasium');
  await page.getByLabel('Klassenstufe').fill('10. Klasse');
  await page.getByLabel('Fach').fill('Geschichte');

  await page.getByLabel('Wie heißt die simulierte Person? *').fill(characterName);

  await page
    .getByLabel('Wie kann die simulierte Person kurz beschrieben werden? *')
    .fill('Er ist bekannt für seinen Spruch „You can`t see me“ und seine Wrestling-Karriere.');

  await page
    .getByLabel('Welche Kompetenzen sollen die Lernenden erwerben? *')
    .fill('Gut wrestlen können');

  await page
    .getByLabel('Was ist die konkrete Unterrichtssituation? *')
    .fill('Ein Dialog mit John Cena über Erfolg im Leben.');

  await page
    .getByLabel('Wie soll der Dialogpartner antworten?')
    .fill('John Cena soll über seine Karriere und Erfolge sprechen.');

  await page
    .getByLabel('Wie soll der Dialogpartner nicht antworten?')
    .fill('John Cena soll nicht über sein Privatleben sprechen.');

  const submitButton = page.getByRole('button', { name: 'Dialogpartner erstellen' });
  await expect(submitButton).toBeVisible();
  await submitButton.click();

  await page.waitForURL('/characters?visibility=private');

  // check if created with the correct name
  const dialogChatName = page.getByText(characterName).first();
  await expect(dialogChatName).toBeVisible();
  await dialogChatName.click();

  await page.waitForURL('/characters/editor/**');

  // test share page
  await page.selectOption('#Telli-Points', '50');
  await page.selectOption('#maxUsage', '45');
  await page.getByTitle('Dialogpartner teilen').click();

  await page.waitForURL('/characters/editor/**/share');
  const code = await page.locator('#join-code').textContent();

  const countDown = page.locator('#countdown-timer');
  await expect(countDown).toBeVisible();

  const qrCode = page.locator('#qr-code');
  await expect(qrCode).toBeVisible();

  // join chat as teacher
  await page.goto('/logout');
  await page.waitForURL('/login');

  await page.locator('#login-invite-code').fill(code ?? '');

  const loginButton = page.getByRole('button', { name: 'Zum Dialog' });
  await expect(loginButton).toBeVisible();
  await loginButton.click();

  await page.waitForURL('/ua/characters/**/dialog?inviteCode=*');

  // send first message
  await sendMessage(page, 'Wer bist du?');
  await page.getByTitle('Kopieren').click();

  await expect(page.getByLabel('assistant message 1')).toContainText(characterName);

  // regenerate last message
  await regenerateMessage(page);
  await expect(page.getByLabel('assistant message 1')).toContainText(characterName);
});

test('teacher can delete character', async ({ page }) => {
  await login(page, 'teacher');

  await page.goto('/characters?visibility=private');
  await page.waitForURL('/characters?visibility=private');

  await deleteCharacter(page, characterName);

  const deleteConfirmButton = page.getByRole('button', { name: 'Löschen' });
  await expect(deleteConfirmButton).toBeVisible();
  await deleteConfirmButton.click();
  await waitForToast(page, 'Der Dialogpartner wurde erfolgreich gelöscht.');
  await expect(page.getByRole('heading', { name: characterName }).first()).not.toBeVisible();
});
