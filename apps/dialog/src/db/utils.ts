import { env } from '@/env';
import { errorifyFn } from '@/utils/error';
import { createHash, timingSafeEqual } from 'crypto';

export const validateApiKeyByHeadersWithResult = errorifyFn(validateApiKeyByHeaders);
export function validateApiKeyByHeaders(headers: Headers) {
  const authorization = headers.get('Authorization')?.toString();

  if (authorization === undefined) {
    throw Error('Could not get Authorization header');
  }

  const bareApiKey = authorization.substring('Bearer '.length);

  // Use timing-safe comparison to prevent timing attacks
  const providedKeyHash = createHash('sha256').update(bareApiKey).digest();
  const expectedKeyHash = createHash('sha256').update(env.apiKey).digest();
  
  const isValid = timingSafeEqual(providedKeyHash, expectedKeyHash);

  if (!isValid) {
    throw Error('Wrong api key');
  }

  return true;
}
