import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    API_KEY_TELLI_DIALOG: z.string().min(1, 'API_KEY_TELLI_DIALOG is required'),
    BASE_URL_TELLI_DIALOG: z.string().url('BASE_URL_TELLI_DIALOG must be a valid URL'),
    API_KEY_TELLI_API: z.string().min(1, 'API_KEY_TELLI_API is required'),
    BASE_URL_TELLI_API: z.string().url('BASE_URL_TELLI_API must be a valid URL'),
  },
  client: {},
  runtimeEnv: {
    API_KEY_TELLI_DIALOG: process.env.API_KEY_TELLI_DIALOG,
    BASE_URL_TELLI_DIALOG: process.env.BASE_URL_TELLI_DIALOG,
    API_KEY_TELLI_API: process.env.API_KEY_TELLI_API,
    BASE_URL_TELLI_API: process.env.BASE_URL_TELLI_API,
  },
});
