import { test, expect } from '@playwright/test';
import { login } from '../../utils/login';

test('teacher can login, create and join shared chat', async ({ page }) => {
  await login(page, 'teacher');

  await page.goto('/shared-chats');
  await page.waitForURL('/shared-chats');
  await page.getByRole('button', { name: 'Szenario erstellen' }).click();
  await page.waitForURL('/shared-chats/**');

  // configure form
  await page
    .getByLabel('Wie heißt das Szenario? *')
    .fill('Absolutismus unter Ludwig XIV – Gruppe 1 Soldaten');

  await page
    .getByLabel('Wie kann das Szenario kurz beschrieben werden?')
    .fill('Zwischen Absolutismus und Demokratie (Ludwig XIV)');

  await page.getByLabel('Schultyp').fill('Gymnasium');
  await page.getByLabel('Klassenstufe').fill('10. Klasse');
  await page.getByLabel('Fach').fill('Geschichte');

  await page
    .getByLabel('Wie lautet der Auftrag an die Lernenden?')
    .fill('Schüler sollen den Unterschied zwischen Absolutismus und Demokratie verstehen.');

  await page
    .getByLabel('Wie verhält sich telli im Lernszenario? *')
    .fill(
      'Der Chatbot soll aus der Perspektive eines Soldaten im Herrschaftssystem unter Ludwig XIV antworten.',
    );

  const submitButton = page.getByRole('button', { name: 'Szenario erstellen' });
  await expect(submitButton).toBeVisible();
  await submitButton.click();
  const firstSharedChat = page.getByRole('link', { name: 'Absolutismus unter Ludwig XIV' }).first();
  await expect(firstSharedChat).toBeVisible();
  await firstSharedChat.click();
  await page.waitForURL('/shared-chats/**');

  // check if created with right name
  const sharedChatName = page
    .getByText('Absolutismus unter Ludwig XIV – Gruppe 1 Soldaten')
    .first();
  await expect(sharedChatName).toBeVisible();

  const stopSharingButton = page.getByRole('button', { name: 'Stop' });
  if (await stopSharingButton.isVisible()) {
    await stopSharingButton.click();
  }
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
  await page.getByRole('button', { name: 'Szenario erstellen' }).click();
  await page.waitForURL('/shared-chats/**');

  // configure form
  await page
    .getByLabel('Wie heißt das Szenario? *')
    .fill('Absolutismus unter Ludwig XIV – Gruppe 1 Soldaten');

  await page
    .getByLabel('Wie kann das Szenario kurz beschrieben werden?')
    .fill('Zwischen Absolutismus und Demokratie (Ludwig XIV)');

  await page.getByLabel('Schultyp').fill('Gymnasium');
  await page.getByLabel('Klassenstufe').fill('10. Klasse');
  await page.getByLabel('Fach').fill('Geschichte');

  await page
    .getByLabel('Wie lautet der Auftrag an die Lernenden?')
    .fill('Schüler sollen den Unterschied zwischen Absolutismus und Demokratie verstehen.');

  await page
    .getByLabel('Wie verhält sich telli im Lernszenario? *')
    .fill(
      'Der Chatbot soll aus der Perspektive eines Soldaten im Herrschaftssystem unter Ludwig XIV antworten.',
    );

  const submitButton = page.getByRole('button', { name: 'Szenario erstellen' });
  await expect(submitButton).toBeVisible();
  await submitButton.click();

  const firstSharedChat = page.getByRole('link', { name: 'Absolutismus unter Ludwig XIV' }).first();
  await expect(firstSharedChat).toBeVisible();
  await firstSharedChat.click();

  await page.waitForURL('/shared-chats/**');
  const stopSharingButton = page.getByRole('button', { name: 'Stop' });
  if (await stopSharingButton.isVisible()) {
    await stopSharingButton.click();
  }
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
  await page.keyboard.press('Enter');
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

test('data is autosaved on blur', async ({ page }) => {
  await login(page, 'teacher');

  await page.goto('/shared-chats');
  await page.waitForURL('/shared-chats');
  await page.getByRole('button', { name: 'Szenario erstellen' }).click();
  await page.waitForURL('/shared-chats/**');

  // Fill out the form initially
  await page.getByLabel('Wie heißt das Szenario? *').fill('Autosave Test Scenario');

  await page
    .getByLabel('Wie kann das Szenario kurz beschrieben werden?')
    .fill('Test description for autosave validation');

  await page.getByLabel('Schultyp').fill('Gymnasium');
  await page.getByLabel('Klassenstufe').fill('10. Klasse');
  await page.getByLabel('Fach').fill('Geschichte');

  await page
    .getByLabel('Wie lautet der Auftrag an die Lernenden?')
    .fill('Test task for autosave validation');

  await page
    .getByLabel('Wie verhält sich telli im Lernszenario? *')
    .fill('Test behavior for autosave validation');

  const submitButton = page.getByRole('button', { name: 'Szenario erstellen' });
  await expect(submitButton).toBeVisible();
  await submitButton.click();

  await page.waitForURL('/shared-chats/**');
  await page.getByRole('link', { name: 'Autosave Test Scenario' }).first().click();
  await page.waitForURL('/shared-chats/**');

  // Edit and verify autosave for each field
  // Title
  await page.getByLabel('Wie heißt das Szenario? *').fill('New Title');
  await page.getByLabel('Wie heißt das Szenario? *').press('Tab');
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.getByLabel('Wie heißt das Szenario? *')).toHaveValue('New Title');

  // Description
  await page.getByLabel('Wie kann das Szenario kurz beschrieben werden?').fill('New Description');
  await page.getByLabel('Wie kann das Szenario kurz beschrieben werden?').press('Tab');
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.getByLabel('Wie kann das Szenario kurz beschrieben werden?')).toHaveValue(
    'New Description',
  );

  // School Type
  await page.getByLabel('Schultyp').fill('Realschule');
  await page.getByLabel('Schultyp').press('Tab');
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.getByLabel('Schultyp')).toHaveValue('Realschule');

  // Grade Level
  await page.getByLabel('Klassenstufe').fill('9. Klasse');
  await page.getByLabel('Klassenstufe').press('Tab');
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.getByLabel('Klassenstufe')).toHaveValue('9. Klasse');

  // Subject
  await page.getByLabel('Fach').fill('Mathematik');
  await page.getByLabel('Fach').press('Tab');
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.getByLabel('Fach')).toHaveValue('Mathematik');

  // Task
  await page.getByLabel('Wie lautet der Auftrag an die Lernenden?').fill('New Task');
  await page.getByLabel('Wie lautet der Auftrag an die Lernenden?').press('Tab');
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.getByLabel('Wie lautet der Auftrag an die Lernenden?')).toHaveValue('New Task');

  // Behavior
  await page.getByLabel('Wie verhält sich telli im Lernszenario? *').fill('New Behavior');
  await page.getByLabel('Wie verhält sich telli im Lernszenario? *').press('Tab');
  await page.waitForTimeout(1000);
  await page.reload();
  await expect(page.getByLabel('Wie verhält sich telli im Lernszenario? *')).toHaveValue(
    'New Behavior',
  );
});
