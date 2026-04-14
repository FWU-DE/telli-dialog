import { expect, test } from '@playwright/test';
import { AUTH_FILES } from '../utils/const';

const templateCharactersIdentifier = ['Johann Wolfgang von Goethe'];
const templateAssistantsIdentifier = ['Schulorganisationsassistent'];
const templateLearningScenariosIdentifier = ['Lern was über KI'];

test.use({ storageState: AUTH_FILES.teacher });

test('all predefined characters are visible for everyone', async ({ page }) => {
  await page.goto('/characters?filter=official');

  await page.waitForURL('/characters**');

  for (const elementIdentifier of templateCharactersIdentifier) {
    await expect(page.getByRole('button', { name: elementIdentifier })).toBeVisible();
  }
});

test('all predefined assistants are visible for everyone', async ({ page }) => {
  await page.goto('/custom?filter=official');

  await page.waitForURL('/custom**');

  for (const elementIdentifier of templateAssistantsIdentifier) {
    await expect(page.getByRole('button', { name: elementIdentifier })).toBeVisible();
  }
});

test('all predefined learning scenarios are visible for everyone', async ({ page }) => {
  await page.goto('/learning-scenarios?filter=official');

  await page.waitForURL('/learning-scenarios**');

  for (const elementIdentifier of templateLearningScenariosIdentifier) {
    await expect(page.getByRole('button', { name: elementIdentifier })).toBeVisible();
  }
});
