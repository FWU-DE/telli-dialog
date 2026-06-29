import { Page } from '@playwright/test';

export async function focusPage(page: Page) {
  // Manually trigger focus/visibility events to ensure refetch happens
  const waitForSession = page.waitForRequest('**/api/auth/session');
  await page.bringToFront();
  await page.evaluate(() => {
    window.dispatchEvent(new Event('focus'));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await waitForSession;
}
