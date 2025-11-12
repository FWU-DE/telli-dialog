import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  emptyStringAsUndefined: true,
  server: {
    appVersion: z.string().default('0.0.0'),
    databaseUrl: z.string().min(1, 'DATABASE_URL is required'),
    keycloakClientId: z.string().min(1, 'KEYCLOAK_CLIENT_ID is required'),
    keycloakClientSecret: z.string().min(1, 'KEYCLOAK_CLIENT_SECRET is required'),
    keycloakIssuer: z.string().min(1, 'KEYCLOAK_ISSUER is required'),
    nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
    otelMetricExportInterval: z.number().default(60000),
    otelMetricExportTimeout: z.number().default(30000),
    telliDialogApiKey: z.string().min(1, 'API_KEY_TELLI_DIALOG is required'),
    telliDialogBaseUrl: z.string().url('BASE_URL_TELLI_DIALOG must be a valid URL'),
    telliApiApiKey: z.string().min(1, 'API_KEY_TELLI_API is required'),
    telliApiBaseUrl: z.string().url('BASE_URL_TELLI_API must be a valid URL'),
  },
  client: {},
  runtimeEnv: {
    appVersion: process.env.APP_VERSION,
    databaseUrl: process.env.DATABASE_URL,
    keycloakClientId: process.env.KEYCLOAK_CLIENT_ID,
    keycloakClientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
    keycloakIssuer: process.env.KEYCLOAK_ISSUER,
    nodeEnv: process.env.NODE_ENV,
    otelMetricExportInterval: process.env.OTEL_METRIC_EXPORT_INTERVAL,
    otelMetricExportTimeout: process.env.OTEL_METRIC_EXPORT_TIMEOUT,
    telliDialogApiKey: process.env.API_KEY_TELLI_DIALOG,
    telliDialogBaseUrl: process.env.BASE_URL_TELLI_DIALOG,
    telliApiApiKey: process.env.API_KEY_TELLI_API,
    telliApiBaseUrl: process.env.BASE_URL_TELLI_API,
  },
});
