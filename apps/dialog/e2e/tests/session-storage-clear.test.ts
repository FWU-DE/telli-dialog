import { test, expect } from '@playwright/test';
import { AUTH_FILES } from '../utils/const';
import { login } from '../utils/login';

test.use({ storageState: AUTH_FILES.teacher });

test('sessionStorage is cleared after logout and re-login in the same tab', async ({ page }) => {
  await page.goto('/');

  // Wait for SessionWatcher to initialize — it sets login_session_id on the first load.
  await page.waitForFunction(() => sessionStorage.getItem('login_session_id') !== null);

  const sessionIdBeforeLogout = await page.evaluate(() =>
    sessionStorage.getItem('login_session_id'),
  );

  // Simulate per-session state (mirrors what active-info-banners.tsx stores for dismissed banners)
  const testKey = 'dismissed-info-banner-ids';
  const testValue = JSON.stringify(['test-banner-id']);
  await page.evaluate(({ key, value }) => sessionStorage.setItem(key, value), {
    key: testKey,
    value: testValue,
  });
  expect(await page.evaluate((key) => sessionStorage.getItem(key), testKey)).toBe(testValue);

  // Logout and re-login in the same tab
  await login(page, 'teacher');

  // Wait for SessionWatcher to detect the new session, which triggers the sessionStorage clear.
  await page.waitForFunction(
    (prevId) => sessionStorage.getItem('login_session_id') !== prevId,
    sessionIdBeforeLogout,
  );

  expect(await page.evaluate((key) => sessionStorage.getItem(key), testKey)).toBeNull();
});
