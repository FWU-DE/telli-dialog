import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  // Empty client prefix means do not expose any variables to the client
  clientPrefix: '',
  client: {},
  emptyStringAsUndefined: true,
  server: {
    // TODO: @AsamMax - this is highly temporary, just to skip some e2e errors
    apiDatabaseUrl: z.string().optional(),
  },
  runtimeEnv: {
    apiDatabaseUrl: process.env.API_DATABASE_URL,
  },
});
