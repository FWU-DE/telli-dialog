import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  clientPrefix: '',
  client: {},
  emptyStringAsUndefined: true,
  server: {
    databaseUrl: z.string(),
  },
  runtimeEnv: {
    databaseUrl: process.env.DATABASE_URL,
  },
});
