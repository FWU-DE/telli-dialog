import { expect, test } from '@playwright/test';
import { login } from '../utils/login';

const templateCharactersIdentifier = ['Johann Wolfgang von Goethe'];
const templateCustomGptsIdentifier = ['Schulorganisationsassistent'];
const templateLearningScenariosIdentifier = ['Lern was über KI'];

test('all predefined characters are visible for everyone', async ({ page }) => {
  await login(page, 'teacher');
  await page.goto('/characters?visibility=global');

  await page.waitForURL('/characters**');

  for (const elementIdentifier of templateCharactersIdentifier) {
    await expect(page.getByRole('link', { name: elementIdentifier })).toBeVisible();
  }
});

test('all predefined custom-gpt templates are visible for everyone', async ({ page }) => {
  await login(page, 'teacher');
  await page.goto('/custom?visibility=global');

  await page.waitForURL('/custom**');

  for (const elementIdentifier of templateCustomGptsIdentifier) {
    await expect(page.getByRole('heading', { name: elementIdentifier })).toBeVisible();
  }
});

test('all predefined learning scenarios are visible for everyone', async ({ page }) => {
  await login(page, 'teacher');
  await page.goto('/learning-scenarios?visibility=global');

  await page.waitForURL('/learning-scenarios**');

  for (const elementIdentifier of templateLearningScenariosIdentifier) {
    await expect(page.getByRole('heading', { name: elementIdentifier })).toBeVisible();
  }
});
