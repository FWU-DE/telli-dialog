import { test, expect } from '@playwright/test';
import { login } from '../utils/login';

test('teacher can login, create and join shared chat', async ({ page }) => {
  await login(page, 'teacher');

  await page.goto('/shared-chats');
  await page.waitForURL('/shared-chats');
  await page.getByTitle('Szenario erstellen').click();
  await page.waitForURL('/shared-chats/create');

  // configure form
  await page
    .getByLabel('Wie heißt das Szenario? *')
    .fill('Absolutismus unter Ludwig XIV – Gruppe 1 Soldaten');

  await page
    .getByLabel('Wie kann das Szenario kurz beschrieben werden? *')
    .fill('Zwischen Absolutismus und Demokratie (Ludwig XIV)');

  await page.getByLabel('Schultyp').fill('Gymnasium');
  await page.getByLabel('Klassenstufe').fill('10. Klasse');
  await page.getByLabel('Fach').fill('Geschichte');

  await page
    .getByLabel('Wie lautet der Auftrag an die Lernenden?')
    .fill('Schüler sollen den Unterschied zwischen Absolutismus und Demokratie verstehen.');

  await page
    .getByLabel('Wie verhält sich telli im Lernszenario?')
    .fill(
      'Der Chatbot soll aus der Perspektive eines Soldaten im Herrschaftssystem unter Ludwig XIV antworten.',
    );

  const submitButton = page.getByRole('button', { name: 'Szenario erstellen' });
  await expect(submitButton).toBeVisible();
  await submitButton.click();

  await page.waitForURL('/shared-chats/**');

  // check if created with right name
  const sharedChatName = page
    .getByText('Absolutismus unter Ludwig XIV – Gruppe 1 Soldaten')
    .first();
  await expect(sharedChatName).toBeVisible();

  // test share page
  await page.selectOption('#Telli-Points', '50');
  await page.selectOption('#maxUsage', '30');
  await page.getByTitle('Szenario starten').click();

  await page.waitForURL('/shared-chats/**/share');
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

  await page.waitForURL('/ua/shared-chats/**/dialog?inviteCode=*');
});

test('teacher can login, create and delete shared chat, student can join chat', async ({
  page,
}) => {
  await login(page, 'teacher');

  await page.goto('/shared-chats');
  await page.waitForURL('/shared-chats');
  await page.getByTitle('Szenario erstellen').click();
  await page.waitForURL('/shared-chats/create');

  // configure form
  await page
    .getByLabel('Wie heißt das Szenario? *')
    .fill('Absolutismus unter Ludwig XIV – Gruppe 1 Soldaten');

  await page
    .getByLabel('Wie kann das Szenario kurz beschrieben werden? *')
    .fill('Zwischen Absolutismus und Demokratie (Ludwig XIV)');

  await page.getByLabel('Schultyp').fill('Gymnasium');
  await page.getByLabel('Klassenstufe').fill('10. Klasse');
  await page.getByLabel('Fach').fill('Geschichte');

  await page
    .getByLabel('Wie lautet der Auftrag an die Lernenden?')
    .fill('Schüler sollen den Unterschied zwischen Absolutismus und Demokratie verstehen.');

  await page
    .getByLabel('Wie verhält sich telli im Lernszenario?')
    .fill(
      'Der Chatbot soll aus der Perspektive eines Soldaten im Herrschaftssystem unter Ludwig XIV antworten.',
    );

  const submitButton = page.getByRole('button', { name: 'Szenario erstellen' });
  await expect(submitButton).toBeVisible();
  await submitButton.click();

  await page.waitForURL('/shared-chats/**');

  // test share page
  await page.selectOption('#Telli-Points', '25');
  await page.selectOption('#maxUsage', '30');
  await page.getByTitle('Szenario starten').click();

  // get code
  await page.waitForURL('/shared-chats/**/share');
  const code = await page.locator('#join-code').textContent();

  // join chat as student
  await page.goto('/logout');
  await page.waitForURL('/login');

  await page.locator('#login-invite-code').fill(code ?? '');

  const loginButton = page.getByRole('button', { name: 'Zum Dialog' });
  await expect(loginButton).toBeVisible();
  await loginButton.click();

  await page.waitForURL('/ua/shared-chats/**/dialog?inviteCode=*');

  // send first message
  const startButton = page.getByRole('button', { name: 'Dialog starten' });
  await expect(startButton).toBeVisible();
  await startButton.click();

  await page.getByPlaceholder('Wie kann ich Dir helfen?').fill('Was lernen wir hier?');
  await page.getByLabel('Send Message').click();
  await page.getByTitle('Kopieren').click();

  await expect(page.getByLabel('assistant message 1')).toContainText('Ludwig XIV');

  // new chat
  const newChatButton = page.locator('#destructive-button');
  await expect(newChatButton).toBeVisible();
  await newChatButton.click();

  const deleteConfirmButton = page.getByRole('button', {
    name: 'Aktuellen Chat verwerfen und neu beginnen',
  });
  await expect(deleteConfirmButton).toBeVisible();
  await deleteConfirmButton.click();
});

test('teacher can delete shared chat', async ({ page }) => {
  await login(page, 'teacher');

  await page.goto('/shared-chats');
  await page.waitForURL('/shared-chats');

  const deleteChatButton = page.locator('#destructive-button').first();
  await expect(deleteChatButton).toBeVisible();
  await deleteChatButton.click();

  const deleteChatConfirmButton = page.getByRole('button', {
    name: 'Löschen',
  });
  await expect(deleteChatConfirmButton).toBeVisible();
  await deleteChatConfirmButton.click();
});
