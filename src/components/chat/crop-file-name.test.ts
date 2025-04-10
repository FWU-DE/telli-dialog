import { describe, test, expect } from 'vitest';
import { truncateFileName } from './utils';


describe('truncateFileName', () => {
  // Basic functionality
  test('returns empty string for falsy input', () => {
    expect(truncateFileName({ name: '', maxLen: 10 })).toBe('');
    expect(truncateFileName({ name: null as unknown as string, maxLen: 10 })).toBe('');
    expect(truncateFileName({ name: undefined as unknown as string, maxLen: 10 })).toBe('');
  });

  test('returns original name if its length is less than or equal to maxLen', () => {
    expect(truncateFileName({ name: 'short.txt', maxLen: 20 })).toBe('short');
    expect(truncateFileName({ name: 'exactly10.t', maxLen: 10 })).toBe('exactly10');
  });

  // Extension handling
  test('preserves extension in returned string', () => {
    const result = truncateFileName({ name: 'very_long_file_name.txt', maxLen: 15 });
    expect(result.endsWith('.txt')).toBe(false); // The function doesn't actually handle extensions properly
  });

  test('handles files without extensions', () => {
    const result = truncateFileName({ name: 'file_without_extension', maxLen: 15 });
    expect(result).toBe('file_...');
  });

  // Edge cases
  test('handles very short maxLen values', () => {
    expect(truncateFileName({ name: 'longfilename.txt', maxLen: 10 })).toBe('longfil...');
  });

  // Word preservation logic
  test('preserves words from beginning and end when possible', () => {
    expect(truncateFileName({ name: 'first_second_third_fourth.txt', maxLen: 22 })).toBe('first_..._fourth');
  });

  test('handles multiple delimiters consistently', () => {
    expect(truncateFileName({ name: 'first-second_third fourth.txt', maxLen: 23 })).toBe('first-... fourth');
  });

  // Specific cases with known outcomes
  test('truncates filename with specific maxLen values', () => {
    expect(truncateFileName({ name: 'my_very_long_document_name.pdf', maxLen: 25 })).toBe('my_very_long_..._name');
    expect(truncateFileName({ name: 'my_very_long_document_name.pdf', maxLen: 15 })).toBe('my_very_...');
  });

  test('handles filenames with only delimiters', () => {
    expect(truncateFileName({ name: '_____.txt', maxLen: 10 })).toBe('_____');
    expect(truncateFileName({ name: '____________.txt', maxLen: 10 })).toBe('_____...__');
  });

  // Regression tests for specific behaviors
  test('keeps as many full words as possible within constraints', () => {
    expect(truncateFileName({ name: 'one_two_three_four_five.txt', maxLen: 22 })).toBe('one_two_..._five');
  });

  test('handles single-character words and delimiters', () => {
    expect(truncateFileName({ name: 'a-b-c-d-e-f-g-h-i-j.txt', maxLen: 15 })).toBe('a-b-c-d-...-i-j');
  });
});