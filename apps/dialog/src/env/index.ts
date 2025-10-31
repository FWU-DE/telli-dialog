import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    authSecret: z.string().min(1),
    databaseUrl: z.string(),
    otcBucketName: z.string().min(1),
    otcSecretAccessKey: z.string().min(1),
    otcAccessKeyId: z.string().min(1),
    otcS3Hostname: z.string().min(1),
    vidisClientId: z.string().min(1),
    vidisClientSecret: z.string().min(1),
    vidisIssuerUri: z.string().min(1),
    apiUrl: z.string().min(1),
    encryptionKey: z.string().min(1),
    apiKey: z.string().min(1),
    nextauthUrl: z.string().min(1),
    rabbitmqUri: z.string().min(1),
    valkeyUrl: z.string().min(1),
    sentryLogLevel: z
      .union([
        z.literal('fatal'),
        z.literal('error'),
        z.literal('warning'),
        z.literal('log'),
        z.literal('info'),
        z.literal('debug'),
      ])
      .default('info'),
  },
  client: {},
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
    sentryLogLevel: process.env.SENTRY_LOG_LEVEL,
  },
});
