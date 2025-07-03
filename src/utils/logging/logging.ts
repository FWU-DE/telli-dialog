import * as Sentry from '@sentry/nextjs';

export function logMessage(message: string, level: Sentry.SeverityLevel) {
  Sentry.captureMessage(message, level);

  if (process.env.NODE_ENV === 'development') {
    console.log(message);
  }
}

export function logDebug(message: string) {
  logMessage(message, 'debug');
}

export function logInfo(message: string) {
  logMessage(message, 'info');
}
