import { test, expect } from '@playwright/test';
import { login } from '../utils/login';

test('teacher can create character with initial message and verify it appears in shared chat', async ({
  page,
}) => {
  await login(page, 'teacher');

  await page.goto('/characters');
  await page.waitForURL('/characters**');

  const createButton = page.getByRole('button', { name: 'Dialogpartner erstellen' });
  await expect(createButton).toBeVisible();
  await createButton.click();

  await page.waitForURL('/characters/editor/**');

  // configure form with basic details
  await page.getByLabel('Schultyp').fill('Gymnasium');
  await page.getByLabel('Klassenstufe').fill('8. Klasse');
  await page.getByLabel('Fach').fill('Deutsch');

  await page.getByLabel('Wie heißt die simulierte Person? *').fill('Albert Einstein');

  await page
    .getByLabel('Wie kann die simulierte Person kurz beschrieben werden? *')
    .fill('Ein brillanter Physiker, der die Relativitätstheorie entwickelt hat.');

  await page
    .getByLabel('Welche Kompetenzen sollen die Lernenden erwerben? *')
    .fill('Verständnis für wissenschaftliches Denken und Neugier auf die Physik entwickeln.');

  await page
    .getByLabel('Was ist die konkrete Unterrichtssituation? *')
    .fill('Ein Gespräch mit Einstein über seine Entdeckungen und wissenschaftliche Methoden.');

  // Add the initial message - this is the key part of this test
  const initialMessage =
    'Hallo! Ich bin Albert Einstein. Ich freue mich sehr, mit dir über die Geheimnisse des Universums zu sprechen. Was möchtest du über Physik oder meine Arbeit wissen?';
  await page.getByRole('textbox', { name: 'Mit welcher Einstiegsfrage' }).fill(initialMessage);

  await page
    .getByLabel('Wie soll der Dialogpartner antworten?')
    .fill('Einstein soll verständlich und inspirierend über Wissenschaft sprechen.');

  await page
    .getByLabel('Wie soll der Dialogpartner nicht antworten?')
    .fill('Einstein soll nicht zu technisch oder unverständlich antworten.');

  const submitButton = page.getByRole('button', { name: 'Dialogpartner erstellen' });
  await expect(submitButton).toBeVisible();
  await submitButton.click();

  await page.waitForTimeout(3000);

  // check if created with right name
  const dialogChatName = page.getByText('Albert Einstein').first();
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

  // join chat as teacher to test the initial message
  await page.goto('/logout');
  await page.waitForURL('/login');

  await page.locator('#login-invite-code').fill(code ?? '');

  const loginButton = page.getByRole('button', { name: 'Zum Dialog' });
  await expect(loginButton).toBeVisible();
  await loginButton.click();

  await page.waitForURL('/ua/characters/**/dialog?inviteCode=*');

  // Wait for the page to load completely
  await page.waitForTimeout(2000);

  // Verify the initial message appears in the chat interface
  // The initial message should be displayed as an assistant message
  const assistantMessage = page.getByLabel('assistant message 1');
  await expect(assistantMessage).toBeVisible();
  await expect(assistantMessage).toContainText(initialMessage);

  // Test that we can still send a message after the initial message is displayed
  await page.getByPlaceholder('Wie kann ich Dir helfen?').fill('Was ist die Relativitätstheorie?');
  await page.getByRole('button', { name: 'Nachricht abschicken' }).click();

  // Wait for the response and verify that we now have both the initial message and the new conversation
  await page.waitForTimeout(5000);

  // Should have user message (message 2) and assistant response (message 3)
  const userMessage = page.getByLabel('user message 1');
  await expect(userMessage).toBeVisible();
  await expect(userMessage).toContainText('Was ist die Relativitätstheorie?');

  // Check that assistant responded (message 3)
  const secondAssistantMessage = page.getByLabel('assistant message 2');
  await expect(secondAssistantMessage).toBeVisible();
  await expect(secondAssistantMessage).toContainText('Relativitätstheorie');

  // Verify the initial message is still there
  await expect(assistantMessage).toBeVisible();
  await expect(assistantMessage).toContainText(initialMessage);
});

test('teacher can delete character with initial message', async ({ page }) => {
  await login(page, 'teacher');

  await page.goto('/characters?visibility=private');
  await page.waitForURL('/characters?visibility=private');

  const deleteChatButton = page.locator('#destructive-button').first();
  await expect(deleteChatButton).toBeVisible();
  await deleteChatButton.click();

  const deleteChatConfirmButton = page.getByRole('button', {
    name: 'Löschen',
  });
  await expect(deleteChatConfirmButton).toBeVisible();
  await deleteChatConfirmButton.click();
});
