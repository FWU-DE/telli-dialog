import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import {
  configureLearningScenario,
  createLearningScenario,
  deleteLearningScenarioFromDetailPage,
} from '../../utils/learning-scenario';
import { nanoid } from 'nanoid';

test.use({ storageState: AUTH_FILES.teacher });

test.describe('learning scenario overview countdown badge', () => {
  const scenarioName = 'Countdown Test Scenario ' + nanoid(8);

  test('shared learning scenario shows countdown timer on overview card', async ({ page }) => {
    await createLearningScenario(page);
    await configureLearningScenario(page, { name: scenarioName });

    // Stop any existing share first
    const stopButton = page.getByRole('button', { name: 'Stop' });
    if (await stopButton.isVisible()) {
      await stopButton.click();
    }

    // Share the learning scenario
    await page.getByTestId('telli-points-select').click();
    await page.getByRole('option', { name: '50 %' }).click();
    await page.getByTestId('usage-time-select').click();
    await page.getByRole('option', { name: '30 Minuten' }).click();
    await page.getByRole('button', { name: 'Jetzt bereitstellen' }).click();

    await page.waitForURL('/learning-scenarios/**/share');

    // Navigate back to the learning scenarios overview
    await page.goto('/learning-scenarios');
    await page.waitForURL('/learning-scenarios**');

    // Find the entity card for the shared scenario and verify the countdown badge
    const card = page.getByTestId('entity-card').filter({ hasText: scenarioName }).first();
    await expect(card).toBeVisible({ timeout: 15000 });

    const countdownTimer = card.getByRole('timer');
    await expect(countdownTimer).toBeVisible();

    // Clean up
    await card.getByTestId('entity-link').click();
    await page.waitForURL('/learning-scenarios/editor/**');
    await deleteLearningScenarioFromDetailPage(page);
  });
});
