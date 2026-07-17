import { BifrostProviderConfig, BifrostProviderResponse } from './types';

export async function syncBifrostProvider({
  bifrostAdminUrl,
  bifrostManagementApiKey,
  providerConfig,
}: {
  bifrostAdminUrl: string;
  bifrostManagementApiKey?: string;
  providerConfig: BifrostProviderConfig;
}): Promise<void> {
  await ensureBifrostProvider({ bifrostAdminUrl, bifrostManagementApiKey, providerConfig });
  const existingKeysBeforeSync = await listBifrostProviderKeys({
    bifrostAdminUrl,
    bifrostManagementApiKey,
    provider: providerConfig.provider,
  });

  for (const key of providerConfig.keys) {
    await syncBifrostProviderKey({
      bifrostAdminUrl,
      bifrostManagementApiKey,
      provider: providerConfig.provider,
      key,
      existingKeys: existingKeysBeforeSync,
    });
  }
}

async function ensureBifrostProvider({
  bifrostAdminUrl,
  bifrostManagementApiKey,
  providerConfig,
}: {
  bifrostAdminUrl: string;
  bifrostManagementApiKey?: string;
  providerConfig: BifrostProviderConfig;
}): Promise<void> {
  const providerResponse = await bifrostFetch({
    bifrostAdminUrl,
    bifrostManagementApiKey,
    path: `/api/providers/${providerConfig.provider}`,
    init: { method: 'GET' },
  });

  if (providerResponse.status === 404) {
    await assertBifrostResponse(
      bifrostFetch({
        bifrostAdminUrl,
        bifrostManagementApiKey,
        path: '/api/providers',
        init: { method: 'POST', body: JSON.stringify(getAddProviderPayload(providerConfig)) },
      }),
    );
    return;
  }

  const existingProvider = (await assertBifrostResponse(providerResponse).then((r) =>
    r.json(),
  )) as BifrostProviderResponse;

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
  );
}

async function syncBifrostProviderKey({
  bifrostAdminUrl,
  bifrostManagementApiKey,
  provider,
  key,
  existingKeys,
}: {
  bifrostAdminUrl: string;
  bifrostManagementApiKey?: string;
  provider: BifrostProviderConfig['provider'];
  key: BifrostProviderConfig['keys'][number];
  existingKeys: BifrostProviderConfig['keys'];
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
    );
    return;
  }

  await assertBifrostResponse(
    bifrostFetch({
      bifrostAdminUrl,
      bifrostManagementApiKey,
      path: `/api/providers/${provider}/keys`,
      init: { method: 'POST', body: JSON.stringify(key) },
    }),
  );
}

async function listBifrostProviderKeys({
  bifrostAdminUrl,
  bifrostManagementApiKey,
  provider,
}: {
  bifrostAdminUrl: string;
  bifrostManagementApiKey?: string;
  provider: BifrostProviderConfig['provider'];
}): Promise<BifrostProviderConfig['keys']> {
  const keysResponse = await assertBifrostResponse(
    bifrostFetch({
      bifrostAdminUrl,
      bifrostManagementApiKey,
      path: `/api/providers/${provider}/keys`,
      init: { method: 'GET' },
    }),
  );
  const keys = (await keysResponse.json()) as { keys?: BifrostProviderConfig['keys'] };
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
  responsePromise: Response | Promise<Response>,
): Promise<Response> {
  const response = await responsePromise;
  if (response.ok) return response;

  throw new Error(`Bifrost request failed with status ${response.status}`);
}
