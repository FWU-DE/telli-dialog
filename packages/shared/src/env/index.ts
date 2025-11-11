import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  // Empty client prefix means do not expose any variables to the client
  clientPrefix: '',
  client: {},
  emptyStringAsUndefined: true,
  server: {
    authSecret: z.string().optional(),
    databaseUrl: z.string(),
    otcBucketName: z.string(),
    otcSecretAccessKey: z.string(),
    otcAccessKeyId: z.string(),
    otcS3Hostname: z.string(),
    vidisClientId: z.string().optional(),
    vidisClientSecret: z.string().optional(),
    vidisIssuerUri: z.string().optional(),
    apiUrl: z.string().optional(),
    encryptionKey: z.string(),
    apiKey: z.string().optional(),
    nextauthUrl: z.string().optional(),
    rabbitmqUri: z.string().optional(),
    valkeyUrl: z.string().optional(),
  },
  runtimeEnv: {
    authSecret: process.env.AUTH_SECRET,
    databaseUrl: process.env.DATABASE_URL ?? 'todo',
    otcBucketName: process.env.OTC_BUCKET_NAME ?? 'todo',
    otcSecretAccessKey: process.env.OTC_SECRET_ACCESS_KEY ?? 'todo',
    otcAccessKeyId: process.env.OTC_ACCESS_KEY_ID ?? 'todo',
    otcS3Hostname: process.env.OTC_S3_HOSTNAME ?? 'todo',
    vidisClientId: process.env.VIDIS_CLIENT_ID,
    vidisClientSecret: process.env.VIDIS_CLIENT_SECRET,
    vidisIssuerUri: process.env.VIDIS_ISSUER_URI,
    apiUrl: process.env.API_URL,
    encryptionKey: process.env.ENCRYPTION_KEY ?? 'todo',
    apiKey: process.env.API_KEY,
    nextauthUrl: process.env.NEXTAUTH_URL,
    rabbitmqUri: process.env.RABBITMQ_URI,
    valkeyUrl: process.env.VALKEY_URL,
  },
});
