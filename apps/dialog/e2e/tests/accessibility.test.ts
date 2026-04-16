import { expect, type Page, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { AUTH_FILES } from '../utils/const';
import { waitForChatHistory } from '../utils/utils';

async function expectNoAccessibilityViolations(page: Page) {
  const accessibilityScanResults = await new AxeBuilder({ page })
    // Enable all WCAG 2.0 and 2.1 rules tagged as A and AA.
    // Both 2.0 and 2.1 must be included to cover all relevant rules.
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // Disable rules, which cannot be fixed now.
    .disableRules(['color-contrast'])
    .analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
}

test.describe('accessibility checks', () => {
  test.describe('unauthenticated', () => {
    test('login page has no axe violations', async ({ page }) => {
      await page.goto('/login');
      await page.getByTestId('vidis-login-button').waitFor();

      await expectNoAccessibilityViolations(page);
    });
  });

  test.describe('authenticated', () => {
    test.use({ storageState: AUTH_FILES.teacher });

    [
      '/',
      '/image-generation',
      '/assistants',
      '/learning-scenarios',
      '/characters',
      '/top-up',
    ].forEach((url) => {
      test(`page "${url}" has no axe violations`, async ({ page }) => {
        await page.goto(url);
        await waitForChatHistory(page);

        await expectNoAccessibilityViolations(page);
      });
    });
  });
});
