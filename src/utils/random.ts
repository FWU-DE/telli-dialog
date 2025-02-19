import { customAlphabet } from 'nanoid';

export function generateRandom6DigitString() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateRandomPassword(length: number = 20): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

export function cnanoid(
  length = 24,
  alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
) {
  const nanoid = customAlphabet(alphabet, length);

  return nanoid();
}
