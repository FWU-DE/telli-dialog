import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { sendMessage } from '../../utils/chat';

test('sending the first message navigates to /d/[conversationId] without a full page remount', async ({
  page,
}) => {
  await login(page, 'teacher');

  // Start on the home page (new chat)
  expect(page.url()).toMatch(/\/$/);

  await sendMessage(page, 'Schreibe "OK"');

  // URL should have been updated to /d/<uuid> …
  await expect(page).toHaveURL(/\/d\//);

  // … but the Chat component must NOT have remounted — the assistant reply is still visible
  await expect(page.getByLabel('assistant message 1')).toBeVisible();
});

test('download button is disabled before the first message and enabled afterwards', async ({
  page,
}) => {
  await login(page, 'teacher');

  const downloadButton = page.getByTitle('Konversation herunterladen');

  // Before any message the button must be disabled
  await expect(downloadButton).toBeDisabled();

  await sendMessage(page, 'Schreibe "OK"');

  // After the first exchange the download button must be enabled without a page reload
  await expect(downloadButton).toBeEnabled();
});

test('"Neuer Chat" after a conversation shows an empty chat, not the old messages', async ({
  page,
}) => {
  await login(page, 'teacher');

  await sendMessage(page, 'Schreibe "OK"');

  // URL now shows /d/<uuid> (updated via replaceState — Next.js still thinks route is /)
  await expect(page).toHaveURL(/\/d\//);
  await expect(page.getByLabel('assistant message 1')).toBeVisible();

  // Click "Neuer Chat" — must navigate to a blank home page
  await page.getByLabel('Neuer Chat').click();
  await page.waitForURL('/');

  // Old messages must be gone and input must be empty
  await expect(page.getByLabel('assistant message 1')).not.toBeVisible();
  await expect(page.getByPlaceholder('Wie kann ich Dir helfen?')).toHaveValue('');
});

test('the typed prompt is not lost after the first assistant response arrives', async ({
  page,
}) => {
  await login(page, 'teacher');

  await sendMessage(page, 'Schreibe "OK"');

  // Chat input should still be present and empty (ready for next message),
  // NOT missing from the DOM (which would indicate a remount lost the component)
  const chatInput = page.getByPlaceholder('Wie kann ich Dir helfen?');
  await expect(chatInput).toBeVisible();
  await expect(chatInput).toHaveValue('');

  // Type a follow-up prompt to confirm input works normally
  const followUpPrompt = 'Follow-up message';
  await chatInput.fill(followUpPrompt);
  await expect(chatInput).toHaveValue(followUpPrompt);
});
