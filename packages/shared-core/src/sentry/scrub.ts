import { Breadcrumb, ErrorEvent, TransactionEvent } from '@sentry/core';

const REDACTED_VALUE = '[REDACTED]';
const SENSITIVE_PROPERTIES = new Set(
  ['prompt', 'content', 'text', 'input'].map((x) => x.toLowerCase()),
);

/** Recursively scrubs sensitive properties from an object. */
function scrubObject(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map(scrubObject);
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = key.toLowerCase();
    if (SENSITIVE_PROPERTIES.has(normalizedKey)) {
      result[key] = REDACTED_VALUE;
    } else {
      result[key] = scrubObject(value);
    }
  }
  return result;
}

/**
 * Performs client-side data scrubbing of events before publishing to Sentry.
 *
 * Sentry performs additional scrubbing on the server side, but this provides an additional layer
 * of protection for sensitive data and reduces the amount of published data.
 */
export function scrubSentryEvent<T extends Breadcrumb | ErrorEvent | TransactionEvent>(
  event: T,
): T {
  // module information is not needed, can be very large and can also be retrieved from git
  if ('modules' in event) delete event.modules;
  if ('request' in event) {
    // cookies can contain sensitive information and are not needed for debugging
    if (event?.request?.headers) event.request.headers.cookie = REDACTED_VALUE;
    delete event?.request?.cookies;

    // request.data (i.e., HTTP body) can contain sensitive information (e.g., prompts)
    if (event?.request?.data) {
      if (typeof event.request.data === 'string') {
        try {
          const parsed: unknown = JSON.parse(event.request.data);
          const scrubbed = scrubObject(parsed);
          event.request.data = JSON.stringify(scrubbed);
        } catch {
          // ignore parsing failures
        }
      } else {
        event.request.data = scrubObject(event.request.data);
      }
    }
  }

  return event;
}
