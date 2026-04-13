import path from 'node:path';

export const E2E_FEDERAL_STATE = 'DE-TEST';

export const AUTH_FILES = {
  teacher: path.resolve(process.cwd(), '.playwright-auth/teacher.json'),
  teacher2: path.resolve(process.cwd(), '.playwright-auth/teacher2.json'),
};
