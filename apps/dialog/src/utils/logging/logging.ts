import * as Sentry from '@sentry/nextjs';
import { env } from '@/env';

const logLevelOrder = ['fatal', 'error', 'warning', 'log', 'info', 'debug'] as const;
const logLevels = logLevelOrder.slice(
  0,
  1 + logLevelOrder.indexOf(env.NEXT_PUBLIC_SENTRY_LOG_LEVEL),
);

export function logMessage(
  message: string,
  level: Sentry.SeverityLevel,
  extra?: Record<string, unknown>,
) {
  if (logLevels.includes(level)) {
    Sentry.captureMessage(message, { level, extra });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[${level.toUpperCase()}] ${message}`, extra);
  }
}

export function logDebug(message: string, extra?: Record<string, unknown>) {
  logMessage(message, 'debug', extra);
}

export function logInfo(message: string, extra?: Record<string, unknown>) {
  logMessage(message, 'info', extra);
}

export function logWarning(message: string, extra?: Record<string, unknown>) {
  logMessage(message, 'warning', extra);
}

export function logError(message: string, error: unknown) {
  if (error instanceof Error) {
    // The error class name will be used as issue title in sentry, therefore passing the message as additional data
    Sentry.captureException(error, { level: 'error', extra: { message } });
  } else {
    Sentry.captureMessage(message, { level: 'error', extra: { error } });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`[ERROR] ${message}`, error);
  }
}
