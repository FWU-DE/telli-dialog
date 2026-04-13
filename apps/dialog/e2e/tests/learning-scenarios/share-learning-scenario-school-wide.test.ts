import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../../utils/const';
import { configureLearningScenario, createLearningScenario } from '../../utils/learning-scenario';
import { nanoid } from 'nanoid';

const learningScenarioName = 'Absolutismus unter Ludwig XIV – ' + nanoid(8);

test.describe('share learning scenario school-wide', () => {
  test.use({ storageState: AUTH_FILES.teacher2 });

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage({ storageState: AUTH_FILES.teacher });

    await createLearningScenario(page);
    await configureLearningScenario(page, { name: learningScenarioName });
    await page.getByRole('checkbox', { name: 'Schulintern' }).click();

    await page.close();
  });

  test('shared learning scenario is visible for teacher2', async ({ page }) => {
    await page.goto('/learning-scenarios?visibility=school');
    await page.waitForURL('/learning-scenarios?visibility=school**');

    await expect(page.getByText(learningScenarioName).first()).toBeVisible();
  });
});
