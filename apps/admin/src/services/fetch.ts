import { env } from '../consts/env';

export type FetchOptions = {
  method?: string;
  mode?: RequestMode;
  body?: BodyInit;
};

export async function fetchFromApi(url: string, options?: FetchOptions): Promise<Response> {
  return fetchGeneric(url, env.API_KEY_TELLI_API, options);
}

export async function fetchFromDialog(url: string, options?: FetchOptions): Promise<Response> {
  return fetchGeneric(url, env.API_KEY_TELLI_DIALOG, options);
}

export async function fetchGeneric(
  url: string,
  apiKey: string,
  options?: FetchOptions,
): Promise<Response> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch data: ${response.statusText}`);
  }

  return response;
}
