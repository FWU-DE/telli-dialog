import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.node');

    const { registerCleanupHandler } = await import('@shared/shutdown/cleanup');
    const { shutdownDatabase } = await import('@shared/db');

    registerCleanupHandler(shutdownDatabase);
  }
}

export const onRequestError = Sentry.captureRequestError;
