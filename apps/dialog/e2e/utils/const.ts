import path from 'node:path';

export const E2E_FEDERAL_STATE = 'DE-TEST';

/**
 * Paths to persisted Playwright authentication state files, one per test user.
 *
 * These files are written by `global-setup.ts` before the test suite runs and
 * contain the browser storage state (cookies + localStorage) of a logged-in
 * session. They are git-ignored and recreated on every `playwright test` run.
 *
 * Usage in test files:
 * ```ts
 * import { AUTH_FILES } from '../utils/const';
 * test.use({ storageState: AUTH_FILES.teacher });
 * ```
 */
export const AUTH_FILES = {
  teacher: path.resolve(process.cwd(), '.playwright-auth/teacher.json'),
  teacher2: path.resolve(process.cwd(), '.playwright-auth/teacher2.json'),
};
