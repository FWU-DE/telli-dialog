// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/
import * as Sentry from '@sentry/nextjs';

const environment = process.env.SENTRY_ENVIRONMENT;
const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  integrations: [
    Sentry.captureConsoleIntegration({ levels: ['warn', 'error'] }),
    Sentry.postgresIntegration(),
  ],
  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  profilesSampleRate: 1,
  environment,
});
