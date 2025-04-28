import { test, expect } from '@playwright/test';
import { login } from '../utils/login';

const templateCharactersIdentifier = [
  'Rosa Parks Civil rights',
  'George W. Bush 43. Präsident',
  'Anne Frank Intelligentes jü',
  'Johann Wolfgang von Goethe',
  'Frau Goß Schulinterne',
  'Polizeioberkommissarin Julia',
];

test('alle predefined characters are visible for everyone', async ({ page }) => {
  await login(page, 'teacher');
  await page.goto('/characters?visibility=global');

  await page.waitForURL('/characters**');

  for (const elementIdentifier of templateCharactersIdentifier) {
    await expect(page.getByRole('link', { name: elementIdentifier })).toBeVisible();
  }
});
