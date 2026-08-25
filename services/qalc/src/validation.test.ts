import { describe, expect, it } from 'vitest';
import { parseJsonBody, validateRequest } from './validation.js';

describe('validation', () => {
  it('accepts an expression and rejects malformed requests', () => {
    expect(validateRequest({ expression: '1 + 1' })).toBeUndefined();
    expect(validateRequest({ expression: '' })).toBeTruthy();
    expect(validateRequest({ expression: '   ' })).toBeTruthy();
    expect(validateRequest({ expression: 1 })).toBeTruthy();
    expect(parseJsonBody('{')).toBeUndefined();
  });

  it('trims the expression before applying the length limit and execution', () => {
    const request = { expression: '  1 + 1  ' };
    expect(validateRequest(request)).toBeUndefined();
    expect(request.expression).toBe('1 + 1');

    expect(validateRequest({ expression: ` ${'x'.repeat(4096)} ` })).toBeUndefined();
    expect(validateRequest({ expression: ` ${'x'.repeat(4096)}x ` })).toBe(
      'expression is too long',
    );
  });
});
