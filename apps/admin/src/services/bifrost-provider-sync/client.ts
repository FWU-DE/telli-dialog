import { env } from '@/consts/env';
import { BifrostProviderSyncError } from '@/types/bifrost-provider-sync-error';
import { logError } from '@shared/logging';
import {
  BifrostKey,
  BifrostProvider,
  BifrostProviderConfig,
  BifrostProviderResponse,
} from './types';

/**
 * Applies one provider config and all of its keys to Bifrost.
 *
 * Bifrost updates keys by ID, while our desired state is keyed by deterministic names.
 * Therefore we list keys once and use that list to decide whether to create or update each key.
 */
export async function syncBifrostProvider(
  bifrostAdminUrl: string,
  providerConfig: BifrostProviderConfig,
): Promise<void> {
  await ensureBifrostProvider(bifrostAdminUrl, providerConfig);
  const existingKeysBeforeSync = await listBifrostProviderKeys(
    bifrostAdminUrl,
    providerConfig.provider,
  );
  await Promise.all(
    providerConfig.keys.map((key) =>
      syncBifrostProviderKey(bifrostAdminUrl, providerConfig.provider, key, existingKeysBeforeSync),
    ),
  );
}

async function ensureBifrostProvider(
  bifrostAdminUrl: string,
  providerConfig: BifrostProviderConfig,
): Promise<void> {
  const providerResponse = await bifrostFetch(
    bifrostAdminUrl,
    `/api/providers/${providerConfig.provider}`,
    {
      method: 'GET',
    },
  );

  if (providerResponse.status === 404) {
    await assertBifrostResponse(
      bifrostFetch(bifrostAdminUrl, '/api/providers', {
        method: 'POST',
        body: JSON.stringify(getAddProviderPayload(providerConfig)),
      }),
      providerConfig.provider,
    );
    return;
  }

  const existingProviderResponse = await assertBifrostResponse(
    Promise.resolve(providerResponse),
    providerConfig.provider,
  );
  const existingProvider = (await existingProviderResponse.json()) as BifrostProviderResponse;

  await assertBifrostResponse(
    bifrostFetch(bifrostAdminUrl, `/api/providers/${providerConfig.provider}`, {
      method: 'PUT',
      body: JSON.stringify(getUpdateProviderPayload(providerConfig, existingProvider)),
    }),
    providerConfig.provider,
  );
}

async function syncBifrostProviderKey(
  bifrostAdminUrl: string,
  provider: BifrostProvider,
  key: BifrostKey,
  existingKeys: BifrostKey[],
): Promise<void> {
  const existingKey = existingKeys.find((existingKey) => existingKey.name === key.name);

  if (existingKey?.id) {
    await assertBifrostResponse(
      bifrostFetch(bifrostAdminUrl, `/api/providers/${provider}/keys/${existingKey.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...existingKey, ...key, id: existingKey.id }),
      }),
      provider,
    );
    return;
  }

  await assertBifrostResponse(
    bifrostFetch(bifrostAdminUrl, `/api/providers/${provider}/keys`, {
      method: 'POST',
      body: JSON.stringify(key),
    }),
    provider,
  );
}

async function listBifrostProviderKeys(
  bifrostAdminUrl: string,
  provider: BifrostProvider,
): Promise<BifrostKey[]> {
  const keysResponse = await assertBifrostResponse(
    bifrostFetch(bifrostAdminUrl, `/api/providers/${provider}/keys`, { method: 'GET' }),
    provider,
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

async function bifrostFetch(
  bifrostAdminUrl: string,
  path: string,
  init: RequestInit,
): Promise<Response> {
  return fetch(new URL(path, bifrostAdminUrl), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(env.bifrostManagementApiKey
        ? { Authorization: `Bearer ${env.bifrostManagementApiKey}` }
        : {}),
      ...init.headers,
    },
  });
}

async function assertBifrostResponse(
  responsePromise: Promise<Response>,
  provider: BifrostProvider,
): Promise<Response> {
  const response = await responsePromise;
  if (response.ok) return response;

  const responseText = await response.text();
  logError('Bifrost provider sync request failed', undefined, {
    provider,
    status: response.status,
    response: responseText,
  });
  throw new BifrostProviderSyncError();
}
