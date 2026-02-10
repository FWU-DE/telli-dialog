import * as Sentry from '@sentry/nextjs';
import { env } from './env';
import { isDevelopment } from '@shared/utils/isDevelopment';

const logLevelOrder = ['fatal', 'error', 'warning', 'log', 'info', 'debug'] as const;
const logLevels = logLevelOrder.slice(
  0,
  1 + logLevelOrder.indexOf(env.NEXT_PUBLIC_SENTRY_LOG_LEVEL),
);

/**
 * If Sentry is used in scripts like db:seed, Sentry is not initialized.
 * This function checks whether Sentry has been initialized and can be used safely.
 */
function isSentryInitialized(): boolean {
  try {
    return Sentry.isInitialized();
  } catch {
    return false;
  }
}

export function logMessage(
  message: string,
  level: Sentry.SeverityLevel,
  extra?: Record<string, unknown>,
) {
  if (logLevels.includes(level) && isSentryInitialized()) {
    Sentry.captureMessage(message, { level, extra });
  }

  if (isDevelopment()) {
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

export function logError(message: string, error?: unknown, extra?: Record<string, unknown>) {
  if (isSentryInitialized()) {
    if (error instanceof Error) {
      // The error class name will be used as issue title in sentry, therefore passing the message as additional data
      Sentry.captureException(error, { level: 'error', extra: { message, ...extra } });
    } else {
      Sentry.captureMessage(message, { level: 'error', extra: { error, ...extra } });
    }
  }

  if (isDevelopment()) {
    console.log(`[ERROR] ${message}`, error);
  }
}
