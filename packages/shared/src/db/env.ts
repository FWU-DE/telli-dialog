import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  // Empty client prefix means do not expose any variables to the client
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
