import { describe, it, expect } from 'vitest';
import { cnanoid } from './randomService';

describe('cnanoid', () => {
  it('should generate a string of 24 characters by default', () => {
    const result = cnanoid();
    expect(result.length).toBe(24);
  });

  it('should generate a string of specified length', () => {
    const result = cnanoid(10);
    expect(result.length).toBe(10);
  });

  it('should only contain characters from the default alphabet', () => {
    const result = cnanoid();
    expect(result).toMatch(/^[0-9a-zA-Z]+$/); // Check if it only contains 0-9, a-z, A-Z
  });

  it('should only contain characters from the specified alphabet', () => {
    const result = cnanoid(10, 'ABC123');
    expect(result).toMatch(/^[ABC123]+$/); // Check if it only contains A, B, C, 1, 2, 3
  });

  it('should generate different strings each time it is called', () => {
    const result1 = cnanoid();
    const result2 = cnanoid();
    expect(result1).not.toBe(result2); // Likely to be different with each call
  });

  it('should work with custom alphabet and length', () => {
    const result = cnanoid(5, 'XYZ');
    expect(result.length).toBe(5);
    expect(result).toMatch(/^[XYZ]+$/);
  });
});