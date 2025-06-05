import { customAlphabet } from 'nanoid';

export function cnanoid(
  length = 24,
  alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
) {
  const nanoid = customAlphabet(alphabet, length);

  return nanoid();
}
