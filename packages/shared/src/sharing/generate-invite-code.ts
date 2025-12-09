import { customAlphabet } from 'nanoid';

/**
 * Generates an invite code for a shared chat.
 */
export function generateInviteCode(length = 8) {
  const nanoid = customAlphabet('123456789ABCDEFGHIJKLMNPQRSTUVWXYZ', length);
  return nanoid().toUpperCase();
}
