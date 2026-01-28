import { env } from '@shared/sentry/env';

const publicConfigVariable = '__PUBLIC_CONFIG__';

declare global {
  interface Window {
    /**
     * Public configuration for Sentry exposed by the server to the browser.
     */
    [publicConfigVariable]?: PublicConfig;
  }
}

export type PublicConfig = {
  sentry: {
    dsn?: string;
    environment?: string;
  };
  appVersion?: string;
};

/**
 * Gets the client-side configuration object for Sentry, which was built by `buildPublicConfig`.
 */
export function getPublicConfig(): PublicConfig | undefined {
  return typeof window !== 'undefined' ? window[publicConfigVariable] : undefined;
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
    },
    appVersion: env.appVersion,
  };

  const inlineScript = `window.${publicConfigVariable} = ${JSON.stringify(publicConfig)};`;
  return { inlineScript };
}
