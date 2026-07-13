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

type BifrostProviderConfigFields = Omit<BifrostProviderConfig, 'provider' | 'keys'>;

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

  // Deleted models stay in the API DB for history/admin visibility, but should not be routable.
  const models = (await dbGetAllModelsByOrganizationId(organizationId)).filter(
    (model) => !model.isDeleted,
  );
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
    const provider = getBifrostProviderFromSettings(model.setting.provider);
    if (!provider) {
      logWarning('Skipping unsupported provider for Bifrost sync', {
        provider: model.provider,
        settingProvider: model.setting.provider,
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
  return buildSingleKeyProviderConfigs({
    provider: 'azure',
    models,
    getGroupKey: (setting) => {
      if (setting.provider !== 'azure') return undefined;
      const azureUrl = parseAzureBaseUrl(setting.baseUrl);
      if (!azureUrl) return undefined;
      return `${setting.apiKey}:${azureUrl.endpoint}`;
    },
    buildKey: (setting, groupedModels) => {
      if (setting.provider !== 'azure') throw new BifrostProviderSyncError();
      const azureUrl = parseAzureBaseUrl(setting.baseUrl);
      if (!azureUrl) throw new BifrostProviderSyncError();

      return buildBifrostKey({
        provider: 'azure',
        readableValue: azureUrl.endpoint,
        uniqueValue: setting.apiKey,
        value: setting.apiKey,
        groupedModels,
        extra: {
          aliases: buildAzureAliases(groupedModels),
          azure_key_config: { endpoint: azureUrl.endpoint },
        },
      });
    },
  });
}

function buildOpenAiProviderConfigs(models: LlmModel[]): BifrostProviderConfig[] {
  return buildSingleKeyProviderConfigs({
    provider: 'openai',
    models,
    getGroupKey: (setting) => {
      if (setting.provider !== 'openai') return undefined;
      return `${setting.apiKey}:${setting.baseUrl}`;
    },
    buildConfig: (setting) => {
      if (setting.provider !== 'openai') throw new BifrostProviderSyncError();
      return setting.baseUrl !== DEFAULT_OPENAI_BASE_URL
        ? { network_config: { base_url: setting.baseUrl } }
        : {};
    },
    buildKey: (setting, groupedModels) => {
      if (setting.provider !== 'openai') throw new BifrostProviderSyncError();
      return buildBifrostKey({
        provider: 'openai',
        readableValue: setting.baseUrl,
        uniqueValue: setting.apiKey,
        value: setting.apiKey,
        groupedModels,
      });
    },
  });
}

function buildIonosProviderConfigs(models: LlmModel[]): BifrostProviderConfig[] {
  return buildSingleKeyProviderConfigs({
    provider: 'ionos',
    models,
    getGroupKey: (setting) => {
      if (setting.provider !== 'ionos') return undefined;
      return `${setting.apiKey}:${setting.baseUrl}`;
    },
    buildConfig: (setting) => {
      if (setting.provider !== 'ionos') throw new BifrostProviderSyncError();
      return {
        network_config: {
          base_url: getOrigin(setting.baseUrl) ?? getOrigin(DEFAULT_IONOS_BASE_URL),
        },
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
      };
    },
    buildKey: (setting, groupedModels) => {
      if (setting.provider !== 'ionos') throw new BifrostProviderSyncError();
      return buildBifrostKey({
        provider: 'ionos',
        readableValue: setting.baseUrl,
        uniqueValue: setting.apiKey,
        value: setting.apiKey,
        groupedModels,
      });
    },
  });
}

function buildVertexProviderConfigs(models: LlmModel[]): BifrostProviderConfig[] {
  return buildSingleKeyProviderConfigs({
    provider: 'vertex',
    models,
    getGroupKey: (setting) => {
      if (setting.provider !== 'google') return undefined;
      return `${setting.projectId}:${setting.location}`;
    },
    buildKey: (setting, groupedModels) => {
      if (setting.provider !== 'google') throw new BifrostProviderSyncError();
      return buildBifrostKey({
        provider: 'vertex',
        readableValue: `${setting.projectId}-${setting.location}`,
        uniqueValue: setting.projectId,
        value: '',
        groupedModels,
        extra: {
          vertex_key_config: {
            project_id: setting.projectId,
            region: setting.location,
            auth_credentials: '',
          },
        },
      });
    },
  });
}

function buildSingleKeyProviderConfigs({
  provider,
  models,
  getGroupKey,
  buildKey,
  buildConfig,
}: {
  provider: BifrostProvider;
  models: LlmModel[];
  getGroupKey: (setting: ProviderSettings) => string | undefined;
  buildKey: (setting: ProviderSettings, groupedModels: LlmModel[]) => BifrostKey;
  buildConfig?: (
    setting: ProviderSettings,
    groupedModels: LlmModel[],
  ) => BifrostProviderConfigFields;
}): BifrostProviderConfig[] {
  return groupModelsBySettings(models, getGroupKey).map((groupedModels) => {
    const setting = getFirstModelSetting(groupedModels);

    return {
      provider,
      ...buildConfig?.(setting, groupedModels),
      keys: [buildKey(setting, groupedModels)],
    };
  });
}

function buildBifrostKey({
  provider,
  readableValue,
  uniqueValue,
  value,
  groupedModels,
  extra,
}: {
  provider: BifrostProvider;
  readableValue: string;
  uniqueValue: string;
  value: BifrostSecret;
  groupedModels: LlmModel[];
  extra?: Partial<BifrostKey>;
}): BifrostKey {
  return {
    name: buildKeyName(provider, readableValue, uniqueValue),
    value,
    models: getModelNames(groupedModels),
    weight: 1,
    enabled: true,
    ...extra,
  };
}

function buildAzureAliases(groupedModels: LlmModel[]): Record<string, string> {
  return Object.fromEntries(
    groupedModels.flatMap((model) => {
      const parsedUrl =
        model.setting.provider === 'azure' ? parseAzureBaseUrl(model.setting.baseUrl) : undefined;
      return parsedUrl ? [[model.name, parsedUrl.deployment]] : [];
    }),
  );
}

function getFirstModelSetting(groupedModels: LlmModel[]): ProviderSettings {
  const setting = groupedModels[0]?.setting;
  if (!setting) throw new BifrostProviderSyncError();
  return setting;
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

function getBifrostProviderFromSettings(provider: string): BifrostProvider | undefined {
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
  // The suffix keeps multiple credentials for the same endpoint distinct without exposing the raw secret.
  const hashPart = hashString(`${provider}:${readableValue}:${uniqueValue}`).slice(0, 8);

  return `${provider}-${readablePart}-${hashPart}`;
}

function toReadableKeyNamePart(value: string): string {
  const normalizedValue = toKebabCase(getReadableKeyNameValue(value));

  return normalizedValue.slice(0, 48) || 'default';
}

function getReadableKeyNameValue(value: string): string {
  try {
    const url = new URL(value);
    return url.hostname;
  } catch {
    return value;
  }
}

function toKebabCase(value: string): string {
  const parts: string[] = [];
  let currentPart = '';

  for (const character of value.toLowerCase()) {
    if (isAsciiLetterOrDigit(character)) {
      currentPart += character;
      continue;
    }

    if (currentPart) {
      parts.push(currentPart);
      currentPart = '';
    }
  }

  if (currentPart) {
    parts.push(currentPart);
  }

  return parts.join('-');
}

function isAsciiLetterOrDigit(character: string): boolean {
  const charCode = character.charCodeAt(0);
  const isDigit = charCode >= 48 && charCode <= 57;
  const isLowercaseLetter = charCode >= 97 && charCode <= 122;
  return isDigit || isLowercaseLetter;
}

function getOrigin(value: string): string | undefined {
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

function hashString(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

function parseAzureBaseUrl(baseUrl: string): { endpoint: string; deployment: string } | undefined {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return undefined;
  }

  const urlParts = url.pathname.split('/').filter(Boolean);
  const deploymentIndex = urlParts.findIndex((part) => part === 'deployments');
  const deployment = urlParts[deploymentIndex + 1];

  if (deploymentIndex === -1 || !deployment) return undefined;

  return {
    endpoint: url.origin,
    deployment,
  };
}

async function syncBifrostProvider(
  bifrostAdminUrl: string,
  providerConfig: BifrostProviderConfig,
): Promise<void> {
  await ensureBifrostProvider(bifrostAdminUrl, providerConfig);
  // Bifrost updates keys by ID, so we list keys once and match by our deterministic name.
  // Without this, every sync would create duplicate keys for the same provider settings.
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
