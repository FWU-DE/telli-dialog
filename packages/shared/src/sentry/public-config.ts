import { env } from '@shared/sentry/env';

const publicConfigVariable = '__PUBLIC_CONFIG__';
const publicConfigReadyEvent = 'public-config:ready';

declare global {
  interface Window {
    /**
     * Public configuration for Sentry exposed by the server to the browser.
     */
    [publicConfigVariable]?: PublicConfig;
  }
}

export type PublicConfig = {
  sentry?: {
    dsn: string;
    environment: string;
    tracesSampleRate: number;
  };
  appVersion?: string;
};

/**
 * Gets the client-side configuration object for Sentry, which was built by `buildPublicConfig`.
 */
export async function getPublicConfig(): Promise<PublicConfig | undefined> {
  if (typeof window === 'undefined') {
    return;
  }

  // Check if public config is available and return immediately
  if (window[publicConfigVariable]) {
    return window[publicConfigVariable];
  }

  // If public config is not yet available, wait for the ready event and try again
  await new Promise<void>((resolve) => {
    const onReady = () => resolve();
    window.addEventListener(publicConfigReadyEvent, onReady, { once: true });
    // Re-check after subscribing to avoid missing an event dispatched
    // between the initial check and addEventListener.
    if (window[publicConfigVariable]) {
      window.removeEventListener(publicConfigReadyEvent, onReady);
      resolve();
    }
  });
  return window[publicConfigVariable];
}

/**
 * Builds the client-side configuration object for Sentry
 * and returns an inline script for embedding in a <script> tag.
 */
export function buildPublicConfig() {
  const publicConfig: PublicConfig = {
    sentry: {
      dsn: env.sentryDsn,
      environment: env.sentryEnvironment,
      tracesSampleRate: env.sentryTracesSampleRateClient,
    },
    appVersion: env.appVersion,
  };

  const inlineScript = `
    window.${publicConfigVariable} = ${JSON.stringify(publicConfig)};
    window.dispatchEvent(new CustomEvent('${publicConfigReadyEvent}'));`;
  return { inlineScript };
}
