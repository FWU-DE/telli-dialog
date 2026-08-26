import type { Limits } from './types.js';

export const DEFAULT_LIMITS: Limits = {
  maxExpressionLength: 4096,
  maxBodyBytes: 8192,
  maxOutputBytes: 16384,
  wallTimeMs: 2000,
  concurrency: 4,
};

// Enforce expression, body, output, time, and concurrency limits before evaluation begins.
export function validateRequest(value: unknown, limits = DEFAULT_LIMITS): string | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return 'body must be an object';
  }

  const expression = (value as { expression?: unknown }).expression;
  if (typeof expression !== 'string') {
    return 'expression must be a string';
  }

  const trimmedExpression = expression.trim();
  if (trimmedExpression.length === 0) {
    return 'expression must not be empty';
  }

  if (trimmedExpression.length > limits.maxExpressionLength) {
    return 'expression is too long';
  }

  // Keep the validated value identical to the value sent to the worker.
  (value as { expression: string }).expression = trimmedExpression;
  return undefined;
}

export function parseJsonBody(body: string): unknown {
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return undefined;
  }
}
