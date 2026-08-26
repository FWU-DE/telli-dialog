import { describe, expect, it } from 'vitest';
import { parseCalculatorOutput } from './protocol.js';

describe('qalc protocol', () => {
  it('parses exactly one terse result', () => {
    expect(parseCalculatorOutput('2\n', 10)).toEqual({ status: 'success', result: '2' });
    expect(parseCalculatorOutput('2\nextra', 100).status).toBe('malformed_output');
    expect(parseCalculatorOutput('12345', 3).status).toBe('malformed_output');
  });
});
