import { env } from '@/env';
import { errorifyFn } from '@/utils/error';

export const validateApiKeyByHeadersWithResult = errorifyFn(validateApiKeyByHeaders);
export function validateApiKeyByHeaders(headers: Headers) {
  const authorization = headers.get('Authorization')?.toString();

  if (authorization === undefined) {
    throw Error('Could not get Authorization header');
  }

  const bareApiKey = authorization.substring('Bearer '.length);

  if (bareApiKey !== env.apiKey) {
    throw Error('Wrong api key');
  }

  return true;
}
