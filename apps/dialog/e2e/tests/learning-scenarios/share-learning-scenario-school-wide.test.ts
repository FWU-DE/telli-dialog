import { expect, test } from '@playwright/test';
import { login } from '../../utils/login';
import { configureLearningScenario, createLearningScenario } from '../../utils/learning-scenario';
import { nanoid } from 'nanoid';

const learningScenarioName = 'Absolutismus unter Ludwig XIV – ' + nanoid(8);

test('share learning scenario school-wide', async ({ page }) => {
  await login(page, 'teacher');

  await createLearningScenario(page);

  // configure form
  await configureLearningScenario(page, { name: learningScenarioName });

  await page.getByRole('checkbox', { name: 'Schulintern' }).click();

  // Navigate back to learning scenarios list
  await page.goto('/learning-scenarios');
  await page.waitForURL('/learning-scenarios');
  const listItem = page.getByRole('button', { name: learningScenarioName });
  await expect(listItem).toBeVisible();
  await listItem.click();
  await page.waitForURL('/learning-scenarios/**');

  // check if created with the correct name
  const learningScenario = page.getByText(learningScenarioName).first();
  await expect(learningScenario).toBeVisible();

  // Login as a different teacher to verify school-sharing
  await login(page, 'teacher2');
  await page.goto('/learning-scenarios?visibility=school');
  await page.waitForURL('/learning-scenarios?visibility=school**');

  // Verify the shared character is visible
  await expect(page.getByText(learningScenarioName).first()).toBeVisible();
});
