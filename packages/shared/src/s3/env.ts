import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

// Env variables for S3 storage on OTC
export const env = createEnv({
  clientPrefix: '',
  client: {},
  emptyStringAsUndefined: true,
  server: {
    otcBucketName: z.string(),
    otcSecretAccessKey: z.string(),
    otcAccessKeyId: z.string(),
    otcS3Hostname: z.string(),
  },
  runtimeEnv: {
    otcBucketName: process.env.OTC_BUCKET_NAME,
    otcSecretAccessKey: process.env.OTC_SECRET_ACCESS_KEY,
    otcAccessKeyId: process.env.OTC_ACCESS_KEY_ID,
    otcS3Hostname: process.env.OTC_S3_HOSTNAME,
  },
});
