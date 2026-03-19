const REDACTED_VALUE = '[REDACTED]';
const CIRCULAR_VALUE = '[Circular]';
const SENSITIVE_KEYS = new Set(['prompt', 'content', 'text', 'input']);

export function scrubSentryEvent<T>(event: T): T {
  const cycleDetection = new WeakSet<object>();
  return scrub(cycleDetection, event) as T;
}

function scrub(seen: WeakSet<object>, value: unknown, key = ''): unknown {
  if (SENSITIVE_KEYS.has(key.toLowerCase())) {
    return REDACTED_VALUE;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  if (seen.has(value)) {
    return CIRCULAR_VALUE;
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => scrub(seen, item));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scrub(seen, v, k)]));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
