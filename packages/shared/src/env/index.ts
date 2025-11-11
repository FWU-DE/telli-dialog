import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  // Empty client prefix means do not expose any variables to the client
  clientPrefix: '',
  client: {},
  emptyStringAsUndefined: true,
  server: {
    authSecret: z.string().optional(),
    databaseUrl: z.string().optional(),
    otcBucketName: z.string().optional(),
    otcSecretAccessKey: z.string().optional(),
    otcAccessKeyId: z.string().optional(),
    otcS3Hostname: z.string().optional(),
    vidisClientId: z.string().optional(),
    vidisClientSecret: z.string().optional(),
    vidisIssuerUri: z.string().optional(),
    apiUrl: z.string().optional(),
    encryptionKey: z.string().optional(),
    apiKey: z.string().optional(),
    nextauthUrl: z.string().optional(),
    rabbitmqUri: z.string().optional(),
    valkeyUrl: z.string().optional(),
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
