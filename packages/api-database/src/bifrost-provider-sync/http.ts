import { BifrostProviderSyncError } from './error';
import { BifrostProviderSyncLogger } from './types';

export async function bifrostFetch({
  bifrostAdminUrl,
  bifrostManagementApiKey,
  path,
  init,
}: {
  bifrostAdminUrl: string;
  bifrostManagementApiKey?: string;
  path: string;
  init: RequestInit;
}): Promise<Response> {
  return fetch(new URL(path, bifrostAdminUrl), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(bifrostManagementApiKey ? { Authorization: `Bearer ${bifrostManagementApiKey}` } : {}),
      ...init.headers,
    },
  });
}

export async function assertBifrostResponse(
  responsePromise: Promise<Response>,
  context: string,
  logger?: BifrostProviderSyncLogger,
): Promise<Response> {
  const response = await responsePromise;
  if (response.ok) return response;

  const responseText = await response.text();
  logger?.error?.('Bifrost provider sync request failed', undefined, {
    context,
    status: response.status,
    response: redactBifrostResponse(responseText),
  });
  throw new BifrostProviderSyncError();
}

function redactBifrostResponse(responseText: string): string {
  try {
    // Bifrost error payloads can echo submitted key configs, including Google service account JSON.
    return JSON.stringify(redactValue(JSON.parse(responseText)));
  } catch {
    return '[non-JSON response omitted]';
  }
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactValue);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        shouldRedactKey(key) ? '[redacted]' : redactValue(entryValue),
      ]),
    );
  }

  return value;
}

function shouldRedactKey(key: string): boolean {
  const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  return ['value', 'apikey', 'authcredentials', 'clientsecret', 'privatekey'].includes(
    normalizedKey,
  );
}
