import { dbGetAllModelsByOrganizationId, LlmModel } from '@ais-chat/api-database';
import { DEFAULT_IONOS_BASE_URL, DEFAULT_OPENAI_BASE_URL } from '@ais-chat/api-database/llm-model';
import { env } from '@/consts/env';
import { BifrostProviderSyncError } from '@/types/bifrost-provider-sync-error';
import { logError, logInfo, logWarning } from '@shared/logging';

type BifrostProvider = 'azure' | 'openai' | 'vertex' | 'ionos';

type BifrostSecret =
  | string
  | {
      value: string;
      env_var?: string;
      from_env?: boolean;
    };

type BifrostKey = {
  id?: string;
  name: string;
  value: BifrostSecret;
  models: string[];
  weight: number;
  aliases?: Record<string, string>;
  azure_key_config?: {
    endpoint: BifrostSecret;
  };
  vertex_key_config?: {
    project_id: BifrostSecret;
    region: BifrostSecret;
    auth_credentials?: BifrostSecret;
  };
  enabled?: boolean;
};

type BifrostProviderConfig = {
  provider: BifrostProvider;
  network_config?: {
    base_url?: string;
  };
  custom_provider_config?: {
    base_provider_type: 'openai';
    // Bifrost custom provider request types:
    // https://docs.getbifrost.ai/providers/custom-providers#allowed-request-types
    // Bifrost's officially supported provider endpoint matrix:
    // https://docs.getbifrost.ai/providers/supported-providers/overview
    allowed_requests: {
      list_models: boolean;
      chat_completion: boolean;
      chat_completion_stream: boolean;
      embedding: boolean;
      image_generation: boolean;
    };
  };
  keys: BifrostKey[];
};

type BifrostProviderResponse = Omit<BifrostProviderConfig, 'provider' | 'keys'> & {
  name?: BifrostProvider;
  concurrency_and_buffer_size?: {
    concurrency?: number;
    buffer_size?: number;
  };
  proxy_config?: Record<string, unknown>;
  send_back_raw_request?: boolean;
  send_back_raw_response?: boolean;
  store_raw_request_response?: boolean;
};

type ProviderSettings = LlmModel['setting'];

export async function syncBifrostProvidersForOrganization(organizationId: string): Promise<void> {
  const bifrostAdminUrl = env.bifrostAdminUrl;
  if (!bifrostAdminUrl) {
    logInfo('Bifrost provider sync skipped because BIFROST_ADMIN_URL is not configured', {
      organizationId,
    });
    return;
  }

  const models = await dbGetAllModelsByOrganizationId(organizationId);
  const providerConfigs = buildBifrostProviderConfigs(models);

  try {
    await Promise.all(
      providerConfigs.map((providerConfig) => syncBifrostProvider(bifrostAdminUrl, providerConfig)),
    );
  } catch (error) {
    logError('Error syncing Bifrost providers', error, {
      organizationId,
      providers: providerConfigs.map(({ provider }) => provider),
    });
    throw new BifrostProviderSyncError();
  }
}

function buildBifrostProviderConfigs(models: LlmModel[]): BifrostProviderConfig[] {
  const providerModels = new Map<BifrostProvider, LlmModel[]>();
  for (const model of models) {
    const provider = toBifrostProvider(model.provider);
    if (!provider) {
      logWarning('Skipping unsupported provider for Bifrost sync', {
        provider: model.provider,
        modelId: model.id,
        modelName: model.name,
      });
      continue;
    }

    providerModels.set(provider, [...(providerModels.get(provider) ?? []), model]);
  }

  return mergeBifrostProviderConfigs(
    [...providerModels.entries()].flatMap(([provider, providerModels]) =>
      buildBifrostProviderConfig(provider, providerModels),
    ),
  );
}

function buildBifrostProviderConfig(
  provider: BifrostProvider,
  models: LlmModel[],
): BifrostProviderConfig[] {
  if (provider === 'azure') return buildAzureProviderConfigs(models);
  if (provider === 'openai') return buildOpenAiProviderConfigs(models);
  if (provider === 'ionos') return buildIonosProviderConfigs(models);
  if (provider === 'vertex') return buildVertexProviderConfigs(models);
  return [];
}

function mergeBifrostProviderConfigs(
  providerConfigs: BifrostProviderConfig[],
): BifrostProviderConfig[] {
  const mergedProviderConfigs = new Map<BifrostProvider, BifrostProviderConfig>();

  for (const providerConfig of providerConfigs) {
    const existingConfig = mergedProviderConfigs.get(providerConfig.provider);
    if (!existingConfig) {
      mergedProviderConfigs.set(providerConfig.provider, providerConfig);
      continue;
    }

    if (
      JSON.stringify(existingConfig.network_config) !==
      JSON.stringify(providerConfig.network_config)
    ) {
      logWarning('Multiple network configs found while syncing Bifrost provider', {
        provider: providerConfig.provider,
      });
    }

    mergedProviderConfigs.set(providerConfig.provider, {
      ...existingConfig,
      keys: [...existingConfig.keys, ...providerConfig.keys],
    });
  }

  return [...mergedProviderConfigs.values()];
}

function buildAzureProviderConfigs(models: LlmModel[]): BifrostProviderConfig[] {
  return groupModelsBySettings(models, (setting) => {
    if (setting.provider !== 'azure') return undefined;
    const azureUrl = parseAzureBaseUrl(setting.baseUrl);
    if (!azureUrl) return undefined;
    return `${setting.apiKey}:${azureUrl.endpoint}`;
  }).map((groupedModels) => {
    const setting = groupedModels[0]?.setting;
    if (!setting || setting.provider !== 'azure') {
      throw new BifrostProviderSyncError();
    }

    const azureUrl = parseAzureBaseUrl(setting.baseUrl);
    if (!azureUrl) {
      throw new BifrostProviderSyncError();
    }

    return {
      provider: 'azure',
      keys: [
        {
          name: buildKeyName('azure', azureUrl.endpoint, setting.apiKey),
          value: setting.apiKey,
          models: getModelNames(groupedModels),
          weight: 1,
          aliases: Object.fromEntries(
            groupedModels.flatMap((model) => {
              const parsedUrl =
                model.setting.provider === 'azure'
                  ? parseAzureBaseUrl(model.setting.baseUrl)
                  : undefined;
              return parsedUrl ? [[model.name, parsedUrl.deployment]] : [];
            }),
          ),
          azure_key_config: {
            endpoint: azureUrl.endpoint,
          },
          enabled: true,
        },
      ],
    };
  });
}

function buildOpenAiProviderConfigs(models: LlmModel[]): BifrostProviderConfig[] {
  return groupModelsBySettings(models, (setting) => {
    if (setting.provider !== 'openai') return undefined;
    return `${setting.apiKey}:${setting.baseUrl}`;
  }).map((groupedModels) => {
    const setting = groupedModels[0]?.setting;
    if (!setting || setting.provider !== 'openai') {
      throw new BifrostProviderSyncError();
    }

    return {
      provider: 'openai',
      network_config:
        setting.baseUrl !== DEFAULT_OPENAI_BASE_URL ? { base_url: setting.baseUrl } : undefined,
      keys: [
        {
          name: buildKeyName('openai', setting.baseUrl, setting.apiKey),
          value: setting.apiKey,
          models: getModelNames(groupedModels),
          weight: 1,
          enabled: true,
        },
      ],
    };
  });
}

function buildIonosProviderConfigs(models: LlmModel[]): BifrostProviderConfig[] {
  return groupModelsBySettings(models, (setting) => {
    if (setting.provider !== 'ionos') return undefined;
    return `${setting.apiKey}:${setting.baseUrl}`;
  }).map((groupedModels) => {
    const setting = groupedModels[0]?.setting;
    if (!setting || setting.provider !== 'ionos') {
      throw new BifrostProviderSyncError();
    }

    const baseUrl = setting.baseUrl.replace(/\/v1\/?$/, '');

    return {
      provider: 'ionos',
      network_config: { base_url: baseUrl || DEFAULT_IONOS_BASE_URL.replace(/\/v1\/?$/, '') },
      custom_provider_config: {
        base_provider_type: 'openai',
        allowed_requests: {
          list_models: true,
          chat_completion: true,
          chat_completion_stream: true,
          embedding: true,
          image_generation: true,
        },
      },
      keys: [
        {
          name: buildKeyName('ionos', setting.baseUrl, setting.apiKey),
          value: setting.apiKey,
          models: getModelNames(groupedModels),
          weight: 1,
          enabled: true,
        },
      ],
    };
  });
}

function buildVertexProviderConfigs(models: LlmModel[]): BifrostProviderConfig[] {
  return groupModelsBySettings(models, (setting) => {
    if (setting.provider !== 'google') return undefined;
    return `${setting.projectId}:${setting.location}`;
  }).map((groupedModels) => {
    const setting = groupedModels[0]?.setting;
    if (!setting || setting.provider !== 'google') {
      throw new BifrostProviderSyncError();
    }

    return {
      provider: 'vertex',
      keys: [
        {
          name: buildKeyName(
            'vertex',
            `${setting.projectId}-${setting.location}`,
            setting.projectId,
          ),
          value: '',
          models: getModelNames(groupedModels),
          weight: 1,
          vertex_key_config: {
            project_id: setting.projectId,
            region: setting.location,
            auth_credentials: '',
          },
          enabled: true,
        },
      ],
    };
  });
}

function groupModelsBySettings(
  models: LlmModel[],
  getGroupKey: (setting: ProviderSettings) => string | undefined,
): LlmModel[][] {
  const groupedModels = new Map<string, LlmModel[]>();

  for (const model of models) {
    const key = getGroupKey(model.setting);
    if (!key) continue;
    groupedModels.set(key, [...(groupedModels.get(key) ?? []), model]);
  }

  return [...groupedModels.values()];
}

function toBifrostProvider(provider: string): BifrostProvider | undefined {
  if (provider === 'azure') return 'azure';
  if (provider === 'openai') return 'openai';
  if (provider === 'ionos') return 'ionos';
  if (provider === 'google') return 'vertex';
  return undefined;
}

function getModelNames(models: LlmModel[]): string[] {
  return [...new Set(models.map(({ name }) => name))].sort();
}

function buildKeyName(
  provider: BifrostProvider,
  readableValue: string,
  uniqueValue: string,
): string {
  const readablePart = toReadableKeyNamePart(readableValue);
  const hashPart = hashString(`${provider}:${readableValue}:${uniqueValue}`).slice(0, 8);

  return `${provider}-${readablePart}-${hashPart}`;
}

function toReadableKeyNamePart(value: string): string {
  const normalizedValue = value
    .replace(/^https?:\/\//, '')
    .replace(/\/v1\/?$/, '')
    .replace(/\/openai\/deployments\/.*$/, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return normalizedValue.slice(0, 48) || 'default';
}

function hashString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function parseAzureBaseUrl(baseUrl: string): { endpoint: string; deployment: string } | undefined {
  const [urlWithoutQuery] = baseUrl.split('?');
  if (!urlWithoutQuery) return undefined;

  const urlParts = urlWithoutQuery.split('/');
  const deploymentIndex = urlParts.findIndex((part) => part === 'deployments');
  const deployment = urlParts[deploymentIndex + 1];

  if (deploymentIndex === -1 || !deployment) return undefined;

  return {
    endpoint: urlParts.slice(0, deploymentIndex - 1).join('/'),
    deployment,
  };
}

async function syncBifrostProvider(
  bifrostAdminUrl: string,
  providerConfig: BifrostProviderConfig,
): Promise<void> {
  await ensureBifrostProvider(bifrostAdminUrl, providerConfig);
  await Promise.all(
    providerConfig.keys.map((key) =>
      syncBifrostProviderKey(bifrostAdminUrl, providerConfig.provider, key),
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
): Promise<void> {
  const keysResponse = await assertBifrostResponse(
    bifrostFetch(bifrostAdminUrl, `/api/providers/${provider}/keys`, { method: 'GET' }),
    provider,
  );
  const keys = (await keysResponse.json()) as { keys?: BifrostKey[] };
  const existingKey = keys.keys?.find((existingKey) => existingKey.name === key.name);

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
