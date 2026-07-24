import { BifrostProviderSyncError } from './error';
import {
  BifrostKey,
  BifrostProvider,
  BifrostProviderConfig,
  BifrostProviderResponse,
  BifrostProviderSyncLogger,
} from './types';

/**
 * Applies one provider config and all of its keys to Bifrost.
 *
 * Bifrost updates keys by ID, while our desired state is keyed by deterministic names.
 * Therefore we list keys once and use that list to decide whether to create or update each key.
 */
export async function syncBifrostProvider({
  bifrostAdminUrl,
  bifrostManagementApiKey,
  providerConfig,
  logger,
}: {
  bifrostAdminUrl: string;
  bifrostManagementApiKey?: string;
  providerConfig: BifrostProviderConfig;
  logger?: BifrostProviderSyncLogger;
}): Promise<void> {
  await ensureBifrostProvider({
    bifrostAdminUrl,
    bifrostManagementApiKey,
    providerConfig,
    logger,
  });
  const existingKeysBeforeSync = await listBifrostProviderKeys({
    bifrostAdminUrl,
    bifrostManagementApiKey,
    provider: providerConfig.provider,
    logger,
  });
  await Promise.all(
    providerConfig.keys.map((key) =>
      syncBifrostProviderKey({
        bifrostAdminUrl,
        bifrostManagementApiKey,
        provider: providerConfig.provider,
        key,
        existingKeys: existingKeysBeforeSync,
        logger,
      }),
    ),
  );
}

async function ensureBifrostProvider({
  bifrostAdminUrl,
  bifrostManagementApiKey,
  providerConfig,
  logger,
}: {
  bifrostAdminUrl: string;
  bifrostManagementApiKey?: string;
  providerConfig: BifrostProviderConfig;
  logger?: BifrostProviderSyncLogger;
}): Promise<void> {
  const providerResponse = await bifrostFetch({
    bifrostAdminUrl,
    bifrostManagementApiKey,
    path: `/api/providers/${providerConfig.provider}`,
    init: {
      method: 'GET',
    },
  });

  if (providerResponse.status === 404) {
    await assertBifrostResponse(
      bifrostFetch({
        bifrostAdminUrl,
        bifrostManagementApiKey,
        path: '/api/providers',
        init: {
          method: 'POST',
          body: JSON.stringify(getAddProviderPayload(providerConfig)),
        },
      }),
      providerConfig.provider,
      logger,
    );
    return;
  }

  const existingProviderResponse = await assertBifrostResponse(
    Promise.resolve(providerResponse),
    providerConfig.provider,
    logger,
  );
  const existingProvider = (await existingProviderResponse.json()) as BifrostProviderResponse;

  await assertBifrostResponse(
    bifrostFetch({
      bifrostAdminUrl,
      bifrostManagementApiKey,
      path: `/api/providers/${providerConfig.provider}`,
      init: {
        method: 'PUT',
        body: JSON.stringify(getUpdateProviderPayload(providerConfig, existingProvider)),
      },
    }),
    providerConfig.provider,
    logger,
  );
}

async function syncBifrostProviderKey({
  bifrostAdminUrl,
  bifrostManagementApiKey,
  provider,
  key,
  existingKeys,
  logger,
}: {
  bifrostAdminUrl: string;
  bifrostManagementApiKey?: string;
  provider: BifrostProvider;
  key: BifrostKey;
  existingKeys: BifrostKey[];
  logger?: BifrostProviderSyncLogger;
}): Promise<void> {
  const existingKey = existingKeys.find((existingKey) => existingKey.name === key.name);

  if (existingKey?.id) {
    await assertBifrostResponse(
      bifrostFetch({
        bifrostAdminUrl,
        bifrostManagementApiKey,
        path: `/api/providers/${provider}/keys/${existingKey.id}`,
        init: {
          method: 'PUT',
          body: JSON.stringify({ ...existingKey, ...key, id: existingKey.id }),
        },
      }),
      provider,
      logger,
    );
    return;
  }

  await assertBifrostResponse(
    bifrostFetch({
      bifrostAdminUrl,
      bifrostManagementApiKey,
      path: `/api/providers/${provider}/keys`,
      init: {
        method: 'POST',
        body: JSON.stringify(key),
      },
    }),
    provider,
    logger,
  );
}

async function listBifrostProviderKeys({
  bifrostAdminUrl,
  bifrostManagementApiKey,
  provider,
  logger,
}: {
  bifrostAdminUrl: string;
  bifrostManagementApiKey?: string;
  provider: BifrostProvider;
  logger?: BifrostProviderSyncLogger;
}): Promise<BifrostKey[]> {
  const keysResponse = await assertBifrostResponse(
    bifrostFetch({
      bifrostAdminUrl,
      bifrostManagementApiKey,
      path: `/api/providers/${provider}/keys`,
      init: { method: 'GET' },
    }),
    provider,
    logger,
  );
  const keys = (await keysResponse.json()) as { keys?: BifrostKey[] };
  return keys.keys ?? [];
}

function getAddProviderPayload(providerConfig: BifrostProviderConfig) {
  return {
    provider: providerConfig.provider,
    ...(providerConfig.network_config ? { network_config: providerConfig.network_config } : {}),
    ...(providerConfig.custom_provider_config
      ? { custom_provider_config: providerConfig.custom_provider_config }
      : {}),
  };
}

function getUpdateProviderPayload(
  providerConfig: BifrostProviderConfig,
  existingProvider: BifrostProviderResponse,
) {
  return {
    ...(providerConfig.network_config || existingProvider.network_config
      ? { network_config: providerConfig.network_config ?? existingProvider.network_config }
      : {}),
    ...(existingProvider.concurrency_and_buffer_size
      ? { concurrency_and_buffer_size: existingProvider.concurrency_and_buffer_size }
      : {}),
    ...(existingProvider.proxy_config ? { proxy_config: existingProvider.proxy_config } : {}),
    ...(existingProvider.send_back_raw_request !== undefined
      ? { send_back_raw_request: existingProvider.send_back_raw_request }
      : {}),
    ...(existingProvider.send_back_raw_response !== undefined
      ? { send_back_raw_response: existingProvider.send_back_raw_response }
      : {}),
    ...(existingProvider.store_raw_request_response !== undefined
      ? { store_raw_request_response: existingProvider.store_raw_request_response }
      : {}),
    ...(providerConfig.custom_provider_config || existingProvider.custom_provider_config
      ? {
          custom_provider_config:
            providerConfig.custom_provider_config ?? existingProvider.custom_provider_config,
        }
      : {}),
  };
}

async function bifrostFetch({
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

async function assertBifrostResponse(
  responsePromise: Promise<Response>,
  provider: BifrostProvider,
  logger?: BifrostProviderSyncLogger,
): Promise<Response> {
  const response = await responsePromise;
  if (response.ok) return response;

  const responseText = await response.text();
  logger?.error?.('Bifrost provider sync request failed', undefined, {
    provider,
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
