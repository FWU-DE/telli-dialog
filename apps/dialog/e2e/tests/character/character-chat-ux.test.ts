import { expect, Page, test } from '@playwright/test';
import { login } from '../../utils/login';
import { selectDifferentModel, sendMessage } from '../../utils/chat';
import { configureCharacter, deleteCharacter } from '../../utils/character';
import { waitForToast } from '../../utils/utils';
import { nanoid } from 'nanoid';

/**
 * Creates a character with an initial message, returns its ID extracted from the editor URL.
 */
async function createCharacterWithInitialMessage(
  page: Page,
  name: string,
  initialMessage: string,
): Promise<string> {
  await page.goto('/characters');
  await page.waitForURL('/characters**');

  await page.getByRole('button', { name: 'Dialogpartner erstellen' }).click();
  await page.waitForURL('/characters/editor/**');

  await configureCharacter(page, { name });

  // Fill the optional "initial message" field
  await page.locator('#initialMessage').fill(initialMessage);

  await page.getByRole('button', { name: 'Dialogpartner erstellen' }).click();
  await page.waitForURL('/characters?visibility=private');

  // Click on the card to open its editor and extract the character ID from the URL
  await page.getByText(name).first().click();
  await page.waitForURL('/characters/editor/**');

  const url = page.url();
  // URL shape: /characters/editor/[characterId]
  const characterId = url.split('/characters/editor/')[1]!.split('?')[0]!;
  return characterId;
}

test.describe('character chat UX', () => {
  const characterName = 'Test Charakter ' + nanoid(8);
  const initialMessage = 'Hallo! Ich bin ein Testcharakter. Wie kann ich helfen?';
  let characterId = '';

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page, 'teacher');
    characterId = await createCharacterWithInitialMessage(page, characterName, initialMessage);
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    if (!characterId) return;
    const page = await browser.newPage();
    await login(page, 'teacher');
    await page.goto('/characters?visibility=private');
    await page.waitForURL('/characters?visibility=private');
    await deleteCharacter(page, characterName);
    const deleteConfirmButton = page.getByRole('button', { name: 'Löschen' });
    await expect(deleteConfirmButton).toBeVisible();
    await deleteConfirmButton.click();
    await waitForToast(page, 'Der Dialogpartner wurde erfolgreich gelöscht.');
    await page.close();
  });

  test('character initial message is visible when starting a new conversation', async ({
    page,
  }) => {
    await login(page, 'teacher');
    await page.goto(`/characters/d/${characterId}`);

    // The initial assistant message should appear before any user message
    await expect(page.getByLabel('assistant message 1')).toBeVisible();
    await expect(page.getByLabel('assistant message 1')).toContainText(initialMessage);
  });

  test('character initial message is visible when reopening a conversation from history', async ({
    page,
  }) => {
    await login(page, 'teacher');
    await page.goto(`/characters/d/${characterId}`);

    // The initial message is visible at the start
    await expect(page.getByLabel('assistant message 1')).toBeVisible();

    // Send a user message so the conversation is persisted
    await sendMessage(page, 'Wer bist du?');

    // After first message the URL updates to the specific conversation
    await expect(page).toHaveURL(/\/characters\/d\/.+\/.+/);
    const conversationUrl = page.url();

    // Navigate away
    await page.goto('/');

    // Come back to the same conversation
    await page.goto(conversationUrl);

    // The character's initial message must still appear at position 1
    await expect(page.getByLabel('assistant message 1')).toBeVisible();
    await expect(page.getByLabel('assistant message 1')).toContainText(initialMessage);

    // And the user's message should also be present
    await expect(page.getByLabel('user message 1')).toBeVisible();
    await expect(page.getByLabel('user message 1')).toContainText('Wer bist du?');
  });

  test('switching LLM model in character chat does not clear conversation history', async ({
    page,
  }) => {
    await login(page, 'teacher');
    await page.goto(`/characters/d/${characterId}`);

    // Send first message
    await sendMessage(page, 'Schreibe "OK"');

    // Both initial message and conversation messages should be visible
    await expect(page.getByLabel('assistant message 1')).toBeVisible();
    await expect(page.getByLabel('assistant message 2')).toBeVisible();
    await expect(page.getByLabel('user message 1')).toBeVisible();

    // Switch model
    const switched = await selectDifferentModel(page);
    test.skip(!switched, 'Only one model available – model switching not testable');

    // All messages must still be visible after the model switch
    await expect(page.getByLabel('assistant message 1')).toBeVisible();
    await expect(page.getByLabel('user message 1')).toBeVisible();
    await expect(page.getByLabel('assistant message 2')).toBeVisible();
  });

  test('download button is disabled at start of character chat and enabled after first message', async ({
    page,
  }) => {
    await login(page, 'teacher');
    await page.goto(`/characters/d/${characterId}`);

    const downloadButton = page.getByTitle('Konversation herunterladen');

    // Before any user message the button must be disabled (initial assistant message doesn't count)
    await expect(downloadButton).toBeDisabled();

    await sendMessage(page, 'Schreibe "OK"');

    // After the first exchange the button must be enabled without a page reload
    await expect(downloadButton).toBeEnabled();
  });

  test('switching LLM model in character chat preserves the typed prompt', async ({ page }) => {
    await login(page, 'teacher');
    await page.goto(`/characters/d/${characterId}`);

    const prompt = 'Dieser Prompt soll beim Modellwechsel nicht verschwinden';
    await page.getByPlaceholder('Wie kann ich Dir helfen?').fill(prompt);

    const switched = await selectDifferentModel(page);
    test.skip(!switched, 'Only one model available – model switching not testable');

    await expect(page.getByPlaceholder('Wie kann ich Dir helfen?')).toHaveValue(prompt);
  });
});
