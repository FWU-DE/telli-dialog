import bcrypt from 'bcryptjs';
import { customAlphabet } from 'nanoid';

export async function createApiKeyRecord(): Promise<{
  keyId: string;
  secretHash: string;
  fullKey: string;
}> {
  const { keyId, secretKey, fullKey } = generateApiKey();
  const hashedSecret = await hashSecretKey(secretKey);

  return {
    keyId,
    secretHash: hashedSecret,
    fullKey,
  };
}
export function generateApiKey() {
  const keyId = cnanoid(16);
  const secretKey = cnanoid(32);

  return {
    keyId,
    secretKey,
    fullKey: `sk_${keyId}_${secretKey}`,
  };
}

export async function hashSecretKey(secretKey: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(secretKey, saltRounds);
}

export function cnanoid(
  length = 24,
  alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
) {
  const nanoid = customAlphabet(alphabet, length);
  return nanoid();
}
