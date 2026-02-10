import * as Sentry from '@sentry/nextjs';
import { getPublicConfig } from './public-config';

/**
 * Initializes Sentry on the browser.
 *
 * Exposing the client-side configuration for Sentry using NEXT_PUBLIC variables does not work
 * because the variables will be injected into the browser bundle on build
 * and cannot be adjusted dynamically using env variables.
 *
 * How the sentry setup works:
 * 1. In the apps `layout.tsx`, a <script> tag must be embedded,
 *    which sets the client-side configuration for Sentry in `window.__PUBLIC_CONFIG__` (environment and DSN).
 *    The config is built dynamically using environment variables.
 * 2. Next.js will execute the file `instrumentation-client.ts` in the browser,
 *    which will use the injected config to initialize Sentry.
 *
 * @param options - Optional Sentry browser options, e.g., to use custom sample rates
 */
export async function clientSentryInit(options?: Sentry.BrowserOptions) {
  const publicConfig = await getPublicConfig();

  // If config is not available at runtime, skip client Sentry entirely
  if (publicConfig?.sentry) {
    const { dsn, environment, tracesSampleRate } = publicConfig.sentry;

    Sentry.init({
      debug: false,
      dsn,
      environment,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.captureConsoleIntegration({ levels: ['fatal', 'error', 'warn', 'info'] }),
      ],

      // Capture Replay for 10% of all sessions,
      // plus for 100% of sessions with an error
      // Learn more at
      // https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      tracesSampleRate: tracesSampleRate,

      ...options,
    });
  }
}
