import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  // Empty client prefix means do not expose any variables to the client
  clientPrefix: '',
  client: {},
  emptyStringAsUndefined: true,
  server: {
    apiUrl: z.string(),
    apiKey: z.string(),
    encryptionKey: z.string(),
    nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  },
  runtimeEnv: {
    apiUrl: process.env.API_URL,
    encryptionKey: process.env.ENCRYPTION_KEY,
    apiKey: process.env.API_KEY,
    nodeEnv: process.env.NODE_ENV,
  },
});
