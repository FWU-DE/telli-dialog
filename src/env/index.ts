import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    databaseUrl: z.string(),
    otcBucketName: z.string().min(1),
    otcSecretAccessKey: z.string().min(1),
    otcAccessKeyId: z.string().min(1),
    otcS3Hostname: z.string().min(1),
    vidisClientId: z.string().min(1),
    vidisClientSecret: z.string().min(1),
    vidisBaseUri: z.string().min(1),
    apiUrl: z.string().min(1),
    encryptionKey: z.string().min(1),
    apiKey: z.string().min(1),
  },
  client: {},
  runtimeEnv: {
    databaseUrl: process.env.DATABASE_URL,
    otcBucketName: process.env.OTC_BUCKET_NAME,
    otcSecretAccessKey: process.env.OTC_SECRET_ACCESS_KEY,
    otcAccessKeyId: process.env.OTC_ACCESS_KEY_ID,
    otcS3Hostname: process.env.OTC_S3_HOSTNAME,
    vidisClientId: process.env.VIDIS_CLIENT_ID,
    vidisClientSecret: process.env.VIDIS_CLIENT_SECRET,
    vidisBaseUri: process.env.VIDIS_BASE_URI,
    apiUrl: process.env.API_URL,
    encryptionKey: process.env.ENCRYPTION_KEY,
    apiKey: process.env.API_KEY,
  },
});
