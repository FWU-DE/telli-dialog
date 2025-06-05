import { env } from '@/env';
import { errorifyFn } from '@/utils/error';
import { NextResponse } from 'next/server';

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

export function validateApiKeyByHeadersWithThrow403(headers: Headers) {
  try {
    validateApiKeyByHeaders(headers);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    } else {
      return NextResponse.json({ error: 'Unknown error' }, { status: 403 });
    }
  }
}
