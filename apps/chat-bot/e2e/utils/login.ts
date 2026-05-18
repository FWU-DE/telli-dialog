import { Page } from '@playwright/test';

export async function login(
  page: Page,
  user: string,
  password = 'password',
  options?: {
    /**
     * Whether to use the `vidis_idp_hint=ais-chat-local` query param to navigate directly to the login provider.
     * Defaults to `true`.
     */
    idpHint?: boolean;
    /**
     * Whether to navigate to `/logout` before clearing cookies. Defaults to `true`.
     * Set to `false` to only clear cookies without triggering a server-side logout —
     * useful when testing session detection without actually logging out.
     */
    logout?: boolean;
  },
) {
  const { idpHint = true, logout = true } = options ?? {};

  if (logout) {
    try {
      await page.goto('/logout');
      // After successful logout, user is redirected to /login
      await page.waitForURL('/login');
    } catch (error) {
      // If logout fails, continue anyway as we'll clear cookies next this only happens on firefox
      console.warn('Logout navigation failed, continuing with login process:', error);
    }
  }

  await page.context().clearCookies();

  try {
    if (idpHint) {
      await page.goto('/login?vidis_idp_hint=ais-chat-local');
    } else {
      await page.goto('/login');
    }
  } catch {
    // Login navigation might fail on firefox, wait instead for URL
    await page.waitForURL('/login');
  }

  if (!idpHint) {
    await page.getByTestId('vidis-login-button').click();
  }

  await page.getByLabel('Username').fill(user);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);

  await page.locator('button[type=submit]').click();

  await page.waitForURL('/');
}
