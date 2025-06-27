import * as Sentry from '@sentry/nextjs';

Sentry.init({
  debug: false,
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  integrations: [Sentry.captureConsoleIntegration({ levels: ['warn', 'error'] })],

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  beforeSend(event: Sentry.ErrorEvent) {
    // do not send any logs to sentry for development environment
    if (event.environment === 'development') {
      return null;
    }
    return event;
  },
});

// This export will instrument router navigations, and is only relevant if you enable tracing.
// `captureRouterTransitionStart` is available from SDK version 9.12.0 onwards
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
