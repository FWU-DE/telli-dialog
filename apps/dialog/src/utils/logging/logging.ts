import * as Sentry from '@sentry/nextjs';
import { env } from '@/env';
import { isDevelopment } from '@shared/utils/isDevelopment';

const logLevelOrder = ['fatal', 'error', 'warning', 'log', 'info', 'debug'] as const;
const logLevels = logLevelOrder.slice(
  0,
  1 + logLevelOrder.indexOf(env.NEXT_PUBLIC_SENTRY_LOG_LEVEL),
);

export function logMessage(message: string, level: Sentry.SeverityLevel) {
  if (logLevels.includes(level)) {
    Sentry.captureMessage(message, level);
  }

  if (isDevelopment()) {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }
}

export function logDebug(message: string) {
  logMessage(message, 'debug');
}

export function logInfo(message: string) {
  logMessage(message, 'info');
}

export function logWarning(message: string) {
  logMessage(message, 'warning');
}

export function logError(message: string, error: unknown) {
  if (error instanceof Error) {
    // The error class name will be used as issue title in sentry, therefore passing the message as additional data
    Sentry.captureException(error, { level: 'error', extra: { message } });
  } else {
    Sentry.captureMessage(message, { level: 'error', extra: { error } });
  }

  if (isDevelopment()) {
    console.log(`[ERROR] ${message}`, error);
  }
}
