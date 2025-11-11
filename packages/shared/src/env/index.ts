import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  // Empty client prefix means do not expose any variables to the client
  clientPrefix: '',
  client: {},
  emptyStringAsUndefined: true,
  server: {
    authSecret: z.string(),
    databaseUrl: z.string(),
    otcBucketName: z.string(),
    otcSecretAccessKey: z.string(),
    otcAccessKeyId: z.string(),
    otcS3Hostname: z.string(),
    vidisClientId: z.string(),
    vidisClientSecret: z.string(),
    vidisIssuerUri: z.string(),
    apiUrl: z.string(),
    encryptionKey: z.string(),
    apiKey: z.string(),
    nextauthUrl: z.string(),
    rabbitmqUri: z.string(),
    valkeyUrl: z.string(),
  },
  runtimeEnv: {
    authSecret: process.env.AUTH_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    otcBucketName: process.env.OTC_BUCKET_NAME,
    otcSecretAccessKey: process.env.OTC_SECRET_ACCESS_KEY,
    otcAccessKeyId: process.env.OTC_ACCESS_KEY_ID,
    otcS3Hostname: process.env.OTC_S3_HOSTNAME,
    vidisClientId: process.env.VIDIS_CLIENT_ID,
    vidisClientSecret: process.env.VIDIS_CLIENT_SECRET,
    vidisIssuerUri: process.env.VIDIS_ISSUER_URI,
    apiUrl: process.env.API_URL,
    encryptionKey: process.env.ENCRYPTION_KEY,
    apiKey: process.env.API_KEY,
    nextauthUrl: process.env.NEXTAUTH_URL,
    rabbitmqUri: process.env.RABBITMQ_URI,
    valkeyUrl: process.env.VALKEY_URL,
  },
});
