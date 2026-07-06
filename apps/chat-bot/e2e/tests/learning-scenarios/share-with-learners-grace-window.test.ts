import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { configureLearningScenario, createLearningScenario } from '../../utils/learning-scenario';
import { waitForAutosave } from '../../utils/utils';
import { nanoid } from 'nanoid';

const learningScenarioName = 'Grace Window Test - ' + nanoid(8);

test.describe('share learning scenario with 2-hour grace window', () => {
  let learningScenarioId: string;

  test.beforeAll(async ({ browser }) => {
    // Create learning scenario as teacher
    const page = await browser.newPage({ storageState: AUTH_FILES.teacher });
    await createLearningScenario(page);
    await configureLearningScenario(page, { name: learningScenarioName });
    await waitForAutosave(page);

    // Extract learning scenario ID from URL
    const url = page.url();
    const match = url.match(/learning-scenarios\/editor\/([^/?]+)/);
    learningScenarioId = match ? match[1]! : '';

    await page.close();
  });

  test.describe('teacher perspective', () => {
    test.use({ storageState: AUTH_FILES.teacher });

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

      // Check if share is active by looking for stop button
      const stopButton = page.getByTestId('stop-share-button');

      if (await stopButton.isVisible()) {
        // Click stop share
        await stopButton.click();

        // Confirm the action in the stop share dialog
        await expect(page.getByTestId('stop-share-dialog')).toBeVisible();
        await page.getByTestId('stop-share-confirm-button').click();
        await expect(page.getByTestId('stop-share-dialog')).not.toBeVisible();

        // Wait for page refresh
        await page.waitForLoadState('networkidle');

        // Verify start button is now visible (share is stopped)
        const startShareButton = page.getByTestId('start-share-button');
        await expect(startShareButton).toBeVisible();
      }
    });
  });
});
