import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { configureCharacter, createCharacter } from '../../utils/character';
import { waitForAutosave } from '../../utils/utils';
import { nanoid } from 'nanoid';

test.describe('share character with grace window', () => {
  test.use({ storageState: AUTH_FILES.teacher });

  let characterId: string;

  test.beforeEach(async ({ page }) => {
    await createCharacter(page);
    await configureCharacter(page, { name: 'Grace Window Character Test - ' + nanoid(8) });
    await waitForAutosave(page);

    const url = page.url();
    const match = url.match(/characters\/editor\/([^/?]+)/);
    expect(match, `Expected character editor URL, got: ${url}`).not.toBeNull();
    characterId = match![1]!;
  });

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

    await expect(page.getByTestId('add-additional-time-button')).toBeVisible();
    await expect(page.getByTestId('stop-share-button')).toBeVisible();
  });

  test('can manually stop a share session', async ({ page }) => {
    await page.goto(`/characters/editor/${characterId}`);
    await page.waitForURL(`**/characters/editor/${characterId}**`);

    // Start sharing with 30 minutes
    await page.getByTestId('usage-time-select').click();
    await page.getByTestId('usage-time-option-30').click();
    await page.getByTestId('start-share-button').click();

    await page.waitForURL('**/characters/editor/**/share');

    // Navigate back to editor
    await page.goto(`/characters/editor/${characterId}`);
    await page.waitForURL(`**/characters/editor/${characterId}**`);

    const stopShareButton = page.getByTestId('stop-share-button');
    await expect(stopShareButton).toBeVisible();
    await stopShareButton.click();

    const stopShareDialog = page.getByTestId('stop-share-dialog');
    await expect(stopShareDialog).toBeVisible();

    await page.getByTestId('stop-share-confirm-button').click();
    await expect(stopShareDialog).not.toBeVisible();

    await expect(page.getByTestId('start-share-button')).toBeVisible();
  });
});
