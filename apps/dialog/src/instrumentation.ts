import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.info(
      `NEXT_RUNTIME is ${process.env.NEXT_RUNTIME} - registering nodejs instrumentation.`,
    );
    await import('./instrumentation.node');

    // Run custom startup logic. instrumentation.ts is the only place in next.js that is executed on application startup.
    // This must only be done on node runtime.
    const { startup } = await import('@/startup');
    await startup();
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    console.info(
      `NEXT_RUNTIME is ${process.env.NEXT_RUNTIME} - no instrumentation available for edge.`,
    );
    await import('../sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
