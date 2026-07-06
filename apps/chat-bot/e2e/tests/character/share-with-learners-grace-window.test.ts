import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { configureCharacter, createCharacter } from '../../utils/character';
import { waitForAutosave } from '../../utils/utils';
import { nanoid } from 'nanoid';

const characterName = 'Grace Window Character Test - ' + nanoid(8);

test.describe('share character with grace window', () => {
  let characterId: string;

  test.beforeAll(async ({ browser }) => {
    // Create character as teacher
    const page = await browser.newPage({ storageState: AUTH_FILES.teacher });
    await createCharacter(page);
    await configureCharacter(page, { name: characterName });
    await waitForAutosave(page);

    // Extract character ID from URL
    const url = page.url();
    const match = url.match(/characters\/editor\/([^/?]+)/);
    characterId = match ? match[1]! : '';

    await page.close();
  });

  test.describe('teacher perspective', () => {
    test.use({ storageState: AUTH_FILES.teacher });

    test('can extend a share session that has not yet expired', async ({ page }) => {
      await page.goto(`/characters/editor/${characterId}`);
      await page.waitForURL(`**/characters/editor/${characterId}**`);

      // Select usage time before starting share
      await page.getByTestId('usage-time-select').click();
      await page.getByTestId('usage-time-option-30').click();

      await page.getByTestId('start-share-button').click();

      await page.waitForURL('**/characters/editor/**/share');

      // Navigate back to editor to verify share is active
      await page.goto(`/characters/editor/${characterId}`);

      await expect(page.getByTestId('extend-share-button')).toBeVisible();
      await expect(page.getByTestId('stop-share-button')).toBeVisible();
    });

    test('can manually stop a share session', async ({ page }) => {
      await page.goto(`/characters/editor/${characterId}`);
      await page.waitForURL(`**/characters/editor/${characterId}**`);

      const stopShareButton = page.getByTestId('stop-share-button');

      if (await stopShareButton.isVisible()) {
        await stopShareButton.click();

        const stopShareDialog = page.getByTestId('stop-share-dialog');
        await expect(stopShareDialog).toBeVisible();

        await page.getByTestId('stop-share-confirm-button').click();
        await expect(stopShareDialog).not.toBeVisible();

        await expect(page.getByTestId('start-share-button')).toBeVisible();
      }
    });
  });
});
