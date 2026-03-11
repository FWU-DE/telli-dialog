// this import has to be at the very top to load env vars before anything else
import './load-env';

import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  clientPrefix: '',
  client: {},
  emptyStringAsUndefined: true,
  server: {
    appVersion: z.string().default('0.0.0'),
    apiName: z.string().default('Telli API'),
    apiBaseUrl: z.string().default('http://127.0.0.1:3002'),
    apiKey: z.string(),
    databaseUrl: z.string(),
    nodeEnv: z.string().default('development'),
    otelMetricExportInterval: z.coerce.number().default(60000),
    otelMetricExportTimeout: z.coerce.number().default(30000),
    port: z.coerce.number().default(3002),
    sentryDsn: z.string().optional(),
    sentryEnvironment: z.string().optional(),
    sentryTracesSampleRate: z.coerce.number().default(1.0),
    sentryProfileSessionSampleRate: z.coerce.number().default(0.0),
  },
  runtimeEnv: {
    appVersion: process.env.APP_VERSION,
    apiName: process.env.API_NAME,
    apiBaseUrl: process.env.API_BASE_URL,
    apiKey: process.env.API_KEY,
    databaseUrl: process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    otelMetricExportInterval: process.env.OTEL_METRIC_EXPORT_INTERVAL,
    otelMetricExportTimeout: process.env.OTEL_METRIC_EXPORT_TIMEOUT,
    sentryDsn: process.env.SENTRY_DSN,
    port: process.env.PORT,
    sentryEnvironment: process.env.SENTRY_ENVIRONMENT,
    sentryProfileSessionSampleRate: process.env.SENTRY_PROFILE_SESSION_SAMPLE_RATE,
    sentryTraceSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE,
  },
});
