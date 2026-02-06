import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  emptyStringAsUndefined: true,
  server: {
    gpt4oMiniApiKey: z.string(),
    gpt4oMiniBaseUrl: z.string(),
    gpt5nanoApiKey: z.string(),
    gpt5nanoBaseUrl: z.string(),
    ionosApiKey: z.string(),
    ionosBaseUrl: z.string(),
  },
  runtimeEnv: {
    gpt4oMiniApiKey: process.env.LLM_GPT4OMINI_API_KEY,
    gpt4oMiniBaseUrl: process.env.LLM_GPT4OMINI_BASE_URL,
    gpt5nanoApiKey: process.env.LLM_GPT5NANO_API_KEY,
    gpt5nanoBaseUrl: process.env.LLM_GPT5NANO_BASE_URL,
    ionosApiKey: process.env.LLM_IONOS_API_KEY,
    ionosBaseUrl: process.env.LLM_IONOS_BASE_URL,
  },
});
