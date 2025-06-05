import { describe, it, expect } from 'vitest';
import { cnanoid } from './random';

describe('cnanoid', () => {
  it('should generate a string of 24 characters', () => {
    const result = cnanoid();
    expect(result.length).toBe(24);
  });

  it('should only contain characters from the specified alphabet', () => {
    const result = cnanoid();
    expect(result).toMatch(/^[0-9a-zA-Z]+$/); // Check if it only contains 0-9, a-z, A-Z
  });

  it('should generate different strings each time it is called', () => {
    const result1 = cnanoid();
    const result2 = cnanoid();
    expect(result1).not.toBe(result2); // Likely to be different with each call
  });
});
