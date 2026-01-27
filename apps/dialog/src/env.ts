import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  emptyStringAsUndefined: true,
  server: {
    apiKey: z.string(),
    apiUrl: z.url(),
    appVersion: z.string().default('0.0.0'),
    authSecret: z.string(),
    databaseUrl: z.string(),
    encryptionKey: z.string(),
    nextauthUrl: z.url(),
    otcBucketName: z.string(),
    otcSecretAccessKey: z.string(),
    otcAccessKeyId: z.string(),
    otcS3Hostname: z.string(),
    rabbitmqUri: z.string(),
    vidisClientId: z.string(),
    vidisClientSecret: z.string(),
    vidisIssuerUri: z.string(),
    crawl4AIUrl: z.url().default('http://localhost:11235'),
  },
  client: {
    NEXT_PUBLIC_SENTRY_LOG_LEVEL: z
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
  runtimeEnv: {
    apiKey: process.env.API_KEY,
    apiUrl: process.env.API_URL,
    appVersion: process.env.APP_VERSION,
    authSecret: process.env.AUTH_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    encryptionKey: process.env.ENCRYPTION_KEY,
    nextauthUrl: process.env.NEXTAUTH_URL,
    otcBucketName: process.env.OTC_BUCKET_NAME,
    otcSecretAccessKey: process.env.OTC_SECRET_ACCESS_KEY,
    otcAccessKeyId: process.env.OTC_ACCESS_KEY_ID,
    otcS3Hostname: process.env.OTC_S3_HOSTNAME,
    rabbitmqUri: process.env.RABBITMQ_URI,
    vidisClientId: process.env.VIDIS_CLIENT_ID,
    vidisClientSecret: process.env.VIDIS_CLIENT_SECRET,
    vidisIssuerUri: process.env.VIDIS_ISSUER_URI,
    NEXT_PUBLIC_SENTRY_LOG_LEVEL: process.env.NEXT_PUBLIC_SENTRY_LOG_LEVEL,
    crawl4AIUrl: process.env.CRAWL4AI_URL,
  },
});
