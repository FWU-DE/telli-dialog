import { describe, expect, it } from 'vitest';
import { parseQalcOutput } from './protocol.js';

describe('qalc protocol', () => {
  it('parses exactly one terse result', () => {
    expect(parseQalcOutput('2\n', 10)).toEqual({ status: 'success', result: '2' });
    expect(parseQalcOutput('2\nextra', 100).status).toBe('malformed_output');
    expect(parseQalcOutput('12345', 3).status).toBe('malformed_output');
  });
});
