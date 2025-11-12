import { customAlphabet } from 'nanoid';

/**
 * Generates a random string using a custom alphabet and length.
 * Default alphabet includes alphanumeric characters (0-9, a-z, A-Z).
 * Default length is 24 characters.
 *
 * @param length - The length of the generated string (default: 24)
 * @param alphabet - The alphabet to use for generation (default: alphanumeric)
 * @returns A random string of the specified length using the specified alphabet
 */
export function cnanoid(
  length = 24,
  alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
) {
  const nanoid = customAlphabet(alphabet, length);
  return nanoid();
}
