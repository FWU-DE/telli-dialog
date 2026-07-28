import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  // Empty client prefix means do not expose any variables to the client
  clientPrefix: '',
  client: {},
  emptyStringAsUndefined: true,
  server: {
    valkeyMode: z.enum(['standalone', 'cluster']).default('standalone'),
    valkeyUrl: z.url(),
  },
  runtimeEnv: {
    valkeyMode: process.env.VALKEY_MODE,
    valkeyUrl: process.env.VALKEY_URL,
  },
});
