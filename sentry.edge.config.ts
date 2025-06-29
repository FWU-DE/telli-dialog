// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  debug: true,
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT,
  integrations: [Sentry.captureConsoleIntegration({ levels: ['warn', 'error'] })],

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  profilesSampleRate: 1,
  tracesSampleRate: 1,
});
