import { describe, it, expect } from 'vitest';
import { generateRandom6DigitString, generateRandomPassword, cnanoid } from './random';

describe('generateRandom6DigitString', () => {
  it('should generate a string of 6 digits', () => {
    const result = generateRandom6DigitString();
    expect(result).toMatch(/^\d{6}$/); // Check if it is a 6-digit number
  });

  it('should generate a string that is within the range 100000 to 999999', () => {
    const result = parseInt(generateRandom6DigitString(), 10);
    expect(result).toBeGreaterThanOrEqual(100000);
    expect(result).toBeLessThanOrEqual(999999);
  });

  it('should generate different values each time it is called', () => {
    const result1 = generateRandom6DigitString();
    const result2 = generateRandom6DigitString();
    expect(result1).not.toBe(result2); // Likely to be different with each call
  });
});

describe('generateRandomPassword', () => {
  it('should generate a string of the specified length', () => {
    const length = 10;
    const result = generateRandomPassword(length);
    expect(result.length).toBe(length);
  });

  it('should generate a password with a default length of 20 when no length is provided', () => {
    const result = generateRandomPassword();
    expect(result.length).toBe(20);
  });

  it('should only contain alphanumeric characters', () => {
    const result = generateRandomPassword(30);
    expect(result).toMatch(/^[a-zA-Z0-9]+$/); // Check if it only contains a-z, A-Z, 0-9
  });

  it('should generate different passwords each time it is called', () => {
    const result1 = generateRandomPassword(20);
    const result2 = generateRandomPassword(20);
    expect(result1).not.toBe(result2); // Likely to be different with each call
  });
});

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
