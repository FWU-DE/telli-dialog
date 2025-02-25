import test from '@playwright/test';
import { login } from '../utils/login';

test('can login as teacher', async ({ page }) => {
  await login(page, 'teacher');
});
