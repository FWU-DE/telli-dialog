import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { regenerateMessage, sendMessage } from '../../utils/chat';
import { configureCharacter, deleteCharacter } from '../../utils/character';
import { waitForToast } from '../../utils/utils';
import { nanoid } from 'nanoid';

test.use({ storageState: AUTH_FILES.teacher });

test.describe('create, share, chat, delete', () => {
  const characterName = 'John Cena ' + nanoid(8);

  test('teacher can login, create and join shared dialogpartner chat', async ({ page }) => {
    await page.goto('/characters');
    await page.waitForURL('/characters**');

    const createButton = page.getByRole('button', { name: 'Dialogpartner erstellen' });
    await expect(createButton).toBeVisible();
    await createButton.click();

    await page.waitForURL('/characters/editor/**');

    // configure form
    await configureCharacter(page, {
      name: characterName,
      description: `Er ist bekannt für seinen Spruch „You can't see me“ und seine Wrestling-Karriere.`,
      instructions: 'John Cena soll über seine Karriere und Erfolge sprechen.',
    });

    await page.goto('/characters?visibility=private');

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

    await expect(page.getByLabel('assistant message 1')).toContainText('John Cena');

    // regenerate last message
    await regenerateMessage(page);
    await expect(page.getByLabel('assistant message 1')).toContainText('John Cena');
  });

  test('teacher can delete character', async ({ page }) => {
    await page.goto('/characters?visibility=private');
    await page.waitForURL('/characters?visibility=private');

    await deleteCharacter(page, characterName);

    const deleteConfirmButton = page.getByRole('button', { name: 'Löschen' });
    await expect(deleteConfirmButton).toBeVisible();
    await deleteConfirmButton.click();
    await waitForToast(page, 'Der Dialogpartner wurde erfolgreich gelöscht.');
    await expect(page.getByRole('heading', { name: characterName }).first()).not.toBeVisible();
  });
});
