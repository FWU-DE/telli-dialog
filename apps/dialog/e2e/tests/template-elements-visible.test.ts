import { expect, test } from '@playwright/test';
import { login } from '../utils/login';

const templateCharactersIdentifier = ['Johann Wolfgang von Goethe'];
const templateCustomGptsIdentifier = ['Schulorganisationsassistent'];
const templateLearningScenariosIdentifier = ['Lern was über KI'];

test('all predefined characters are visible for everyone', async ({ page }) => {
  await login(page, 'teacher');
  await page.goto('/characters?filter=official');

  await page.waitForURL('/characters**');

  for (const elementIdentifier of templateCharactersIdentifier) {
    await expect(page.getByRole('button', { name: elementIdentifier })).toBeVisible();
  }
});

test('all predefined custom-gpt templates are visible for everyone', async ({ page }) => {
  await login(page, 'teacher');
  await page.goto('/custom?filter=official');

  await page.waitForURL('/custom**');

  for (const elementIdentifier of templateCustomGptsIdentifier) {
    await expect(page.getByRole('button', { name: elementIdentifier })).toBeVisible();
  }
});

test('all predefined learning scenarios are visible for everyone', async ({ page }) => {
  await login(page, 'teacher');
  await page.goto('/learning-scenarios?filter=official');

  await page.waitForURL('/learning-scenarios**');

  for (const elementIdentifier of templateLearningScenariosIdentifier) {
    await expect(page.getByRole('button', { name: elementIdentifier })).toBeVisible();
  }
});
