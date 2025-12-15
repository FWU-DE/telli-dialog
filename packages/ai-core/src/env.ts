import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  // Empty client prefix means do not expose any variables to the client
  clientPrefix: '',
  client: {},
  emptyStringAsUndefined: true,
  server: {
    apiDatabaseUrl: z.string(),
  },
  runtimeEnv: {
    apiDatabaseUrl: process.env.API_DATABASE_URL,
  },
});
