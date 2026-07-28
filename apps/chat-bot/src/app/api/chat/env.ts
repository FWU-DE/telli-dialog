import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  emptyStringAsUndefined: true,
  server: {
    linkupApiKey: z.string().optional(),
  },
  runtimeEnv: {
    linkupApiKey: process.env.LINKUP_API_KEY,
  },
});
