// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://7527b05b4b63b9e683549aec151d4f05@sentry.logging.deutschlandgpt.de/4',
  integrations: [
    Sentry.captureConsoleIntegration({ levels: ['warn', 'error'] }),
    Sentry.postgresIntegration(),
  ],
  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,
  profilesSampleRate: 1,
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  environment: process.env.SENTRY_ENVIRONMENT,
});
