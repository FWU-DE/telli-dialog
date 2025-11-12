import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  emptyStringAsUndefined: true,
  server: {
    apiKey: z.string().min(1, 'API_KEY is required'),
    apiUrl: z.string().min(1, 'API_URL is required'),
    authSecret: z.string().min(1, 'AUTH_SECRET is required'),
    databaseUrl: z.string().min(1, 'DATABASE_URL is required'),
    encryptionKey: z.string().min(1, 'ENCRYPTION_KEY is required'),
    nextauthUrl: z.string().min(1, 'NEXTAUTH_URL is required'),
    otcBucketName: z.string().min(1, 'OTC_BUCKET_NAME is required'),
    otcSecretAccessKey: z.string().min(1, 'OTC_SECRET_ACCESS_KEY is required'),
    otcAccessKeyId: z.string().min(1, 'OTC_ACCESS_KEY_ID is required'),
    otcS3Hostname: z.string().min(1, 'OTC_S3_HOSTNAME is required'),
    rabbitmqUri: z.string().min(1, 'RABBITMQ_URI is required'),
    valkeyUrl: z.string().min(1, 'VALKEY_URL is required'),
    vidisClientId: z.string().min(1, 'VIDIS_CLIENT_ID is required'),
    vidisClientSecret: z.string().min(1, 'VIDIS_CLIENT_SECRET is required'),
    vidisIssuerUri: z.string().min(1, 'VIDIS_ISSUER_URI is required'),
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
    authSecret: process.env.AUTH_SECRET,
    databaseUrl: process.env.DATABASE_URL,
    encryptionKey: process.env.ENCRYPTION_KEY,
    nextauthUrl: process.env.NEXTAUTH_URL,
    otcBucketName: process.env.OTC_BUCKET_NAME,
    otcSecretAccessKey: process.env.OTC_SECRET_ACCESS_KEY,
    otcAccessKeyId: process.env.OTC_ACCESS_KEY_ID,
    otcS3Hostname: process.env.OTC_S3_HOSTNAME,
    rabbitmqUri: process.env.RABBITMQ_URI,
    valkeyUrl: process.env.VALKEY_URL,
    vidisClientId: process.env.VIDIS_CLIENT_ID,
    vidisClientSecret: process.env.VIDIS_CLIENT_SECRET,
    vidisIssuerUri: process.env.VIDIS_ISSUER_URI,
    NEXT_PUBLIC_SENTRY_LOG_LEVEL: process.env.NEXT_PUBLIC_SENTRY_LOG_LEVEL,
  },
});
