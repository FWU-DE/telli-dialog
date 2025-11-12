import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    telliDialogApiKey: z.string().min(1, 'API_KEY_TELLI_DIALOG is required'),
    telliDialogBaseUrl: z.string().url('BASE_URL_TELLI_DIALOG must be a valid URL'),
    databaseUrl: z.string().min(1, 'DATABASE_URL is required'),
    telliApiApiKey: z.string().min(1, 'API_KEY_TELLI_API is required'),
    telliApiBaseUrl: z.string().url('BASE_URL_TELLI_API must be a valid URL'),
  },
  client: {},
  runtimeEnv: {
    telliDialogApiKey: process.env.API_KEY_TELLI_DIALOG,
    telliDialogBaseUrl: process.env.BASE_URL_TELLI_DIALOG,
    databaseUrl: process.env.DATABASE_URL,
    telliApiApiKey: process.env.API_KEY_TELLI_API,
    telliApiBaseUrl: process.env.BASE_URL_TELLI_API,
  },
});
