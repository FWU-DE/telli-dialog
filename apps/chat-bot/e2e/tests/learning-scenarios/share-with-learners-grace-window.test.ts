import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { configureLearningScenario, createLearningScenario } from '../../utils/learning-scenario';
import { waitForAutosave } from '../../utils/utils';
import { nanoid } from 'nanoid';

test.describe('share learning scenario with 2-hour grace window', () => {
  test.use({ storageState: AUTH_FILES.teacher });

  let learningScenarioId: string;

  test.beforeEach(async ({ page }) => {
    await createLearningScenario(page);
    await configureLearningScenario(page, { name: 'Grace Window Test - ' + nanoid(8) });
    await waitForAutosave(page);

    const url = page.url();
    const match = url.match(/learning-scenarios\/editor\/([^/?]+)/);
    learningScenarioId = match ? match[1]! : '';
  });

  test('can extend a share session that has not yet expired', async ({ page }) => {
    // Navigate to learning scenario editor
    await page.goto(`/learning-scenarios/editor/${learningScenarioId}`);
    await page.waitForURL(`**/learning-scenarios/editor/${learningScenarioId}**`);

    // Start sharing with 30 minutes
    const startShareButton = page.getByTestId('start-share-button');
    await expect(startShareButton).toBeVisible();

    // Select 30 minutes usage time
    await page.getByTestId('usage-time-select').click();
    await page.getByTestId('usage-time-option-30').click();

    // Click start share
    await startShareButton.click();

    // Wait for share to be started
    await page.waitForURL(`**/learning-scenarios/editor/${learningScenarioId}/share`);

    // Navigate back to editor to verify share is active
    await page.goto(`/learning-scenarios/editor/${learningScenarioId}`);

    // Verify extend button and stop button are visible with stable selectors
    await expect(page.getByTestId('add-additional-time-button')).toBeVisible();
    await expect(page.getByTestId('stop-share-button')).toBeVisible();

    // Running shares should allow opening the share page
    await expect(page.getByTestId('open-share-page-button')).toBeEnabled();
  });

  test('can manually stop a share session', async ({ page }) => {
    // Navigate to learning scenario editor
    await page.goto(`/learning-scenarios/editor/${learningScenarioId}`);
    await page.waitForURL(`**/learning-scenarios/editor/${learningScenarioId}**`);

    // Start sharing with 30 minutes
    await page.getByTestId('usage-time-select').click();
    await page.getByTestId('usage-time-option-30').click();
    await page.getByTestId('start-share-button').click();

    // Wait for share to be started
    await page.waitForURL(`**/learning-scenarios/editor/${learningScenarioId}/share`);

    // Navigate back to editor
    await page.goto(`/learning-scenarios/editor/${learningScenarioId}`);
    await page.waitForURL(`**/learning-scenarios/editor/${learningScenarioId}**`);

    // Click stop share
    const stopButton = page.getByTestId('stop-share-button');
    await expect(stopButton).toBeVisible();
    await stopButton.click();

    // Confirm the action in the stop share dialog
    await expect(page.getByTestId('stop-share-dialog')).toBeVisible();
    await page.getByTestId('stop-share-confirm-button').click();
    await expect(page.getByTestId('stop-share-dialog')).not.toBeVisible();

    // Wait for page refresh
    await page.waitForLoadState('networkidle');

    // Verify start button is now visible (share is stopped)
    await expect(page.getByTestId('start-share-button')).toBeVisible();
  });
});
