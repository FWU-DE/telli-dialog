import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { configureCharacter, createCharacter, deleteCharacterFromDetailPage } from '../../utils/character';
import { nanoid } from 'nanoid';

test.use({ storageState: AUTH_FILES.teacher });

test.describe('character overview countdown badge', () => {
  const characterName = 'Countdown Test Character ' + nanoid(8);

  test('shared character shows countdown timer on overview card', async ({ page }) => {
    await createCharacter(page);
    await configureCharacter(page, { name: characterName });

    // Stop any existing share first
    const stopButton = page.getByRole('button', { name: 'Stop' });
    if (await stopButton.isVisible()) {
      await stopButton.click();
    }

    // Share the character
    await page.getByTestId('telli-points-select').click();
    await page.getByRole('option', { name: '50 %' }).click();
    await page.getByTestId('usage-time-select').click();
    await page.getByRole('option', { name: '45 Minuten' }).click();
    await page.getByRole('button', { name: 'Jetzt bereitstellen' }).click();

    await page.waitForURL('/characters/editor/**/share');

    // Navigate back to the characters overview
    await page.goto('/characters');
    await page.waitForURL('/characters**');

    // Find the entity card for the shared character and verify the countdown badge
    const card = page.getByTestId('entity-card').filter({ hasText: characterName }).first();
    await expect(card).toBeVisible({ timeout: 15000 });

    const countdownTimer = card.getByRole('timer');
    await expect(countdownTimer).toBeVisible();

    // Clean up
    await card.getByTestId('entity-link').click();
    await page.waitForURL('/characters/editor/**');
    await deleteCharacterFromDetailPage(page);
  });
});
