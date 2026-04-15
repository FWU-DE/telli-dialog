import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { sendMessage } from '../../utils/chat';
import { waitForToast } from '../../utils/utils';
import { configureCharacter, deleteCharacter } from '../../utils/character';

test.use({ storageState: AUTH_FILES.teacher });

const characterName = 'Albert Einstein';

test('teacher can create character with initial message and verify it appears in shared chat', async ({
  page,
}) => {
  await page.goto('/characters');
  await page.waitForURL('/characters**');

  const createButton = page.getByRole('button', { name: 'Dialogpartner erstellen' });
  await expect(createButton).toBeVisible();
  await createButton.click();

  await page.waitForURL('/characters/editor/**');

  const initialMessage =
    'Hallo! Ich bin Albert Einstein. Ich freue mich sehr, mit dir über die Geheimnisse des Universums zu sprechen. Was möchtest du über Physik oder meine Arbeit wissen?';

  await configureCharacter(page, {
    name: characterName,
    description: 'Ein brillanter Physiker, der die Relativitätstheorie entwickelt hat.',
    instructions: 'Einstein soll verständlich und inspirierend über Wissenschaft sprechen.',
    initialMessage: initialMessage,
  });

  await page.goto('/characters');

  // check if created with the correct name
  const dialogChatName = page.getByText(characterName).first();
  await expect(dialogChatName).toBeVisible();
  await dialogChatName.click();

  await page.waitForURL('/characters/editor/**');

  // test share page
  await page.getByTestId('telli-points-select').click();
  await page.getByRole('option', { name: '50 %' }).click();
  await page.getByTestId('usage-time-select').click();
  await page.getByRole('option', { name: '45 Minuten' }).click();
  await page.getByRole('button', { name: 'Jetzt bereitstellen' }).click();

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
  await page.getByLabel('assistant message 1').waitFor();

  // Verify the initial message appears in the chat interface
  // The initial message should be displayed as an assistant message
  const assistantMessage = page.getByLabel('assistant message 1');
  await expect(assistantMessage).toBeVisible();
  await expect(assistantMessage).toContainText(initialMessage);

  // Test that we can still send a message after the initial message is displayed
  await sendMessage(page, 'Was ist die Relativitätstheorie? Beende die Antwort mit "ENDE".');

  // Should have user message (message 2) and assistant response (message 3)
  const userMessage = page.getByLabel('user message 1');
  await expect(userMessage).toBeVisible();
  await expect(userMessage).toContainText('Was ist die Relativitätstheorie?');

  // Check that assistant responded (message 3)
  const secondAssistantMessage = page.getByLabel('assistant message 2');
  await expect(secondAssistantMessage).toBeVisible();
  await expect(secondAssistantMessage).toContainText('ENDE');

  // Verify the initial message is still there
  await expect(assistantMessage).toBeVisible();
  await expect(assistantMessage).toContainText(initialMessage);
});

test('teacher can delete character with initial message', async ({ page }) => {
  await page.goto('/characters');
  await page.waitForURL('/characters');

  await deleteCharacter(page, characterName);

  const deleteConfirmButton = page.getByRole('button', { name: 'Löschen' });
  await expect(deleteConfirmButton).toBeVisible();
  await deleteConfirmButton.click();
  await waitForToast(page, 'Der Dialogpartner wurde erfolgreich gelöscht.');
  await expect(page.getByRole('heading', { name: characterName }).first()).not.toBeVisible();
});
