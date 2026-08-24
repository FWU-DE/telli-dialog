import type { LlmProviderKeyWithModels } from '../../functions';
import { DEFAULT_IONOS_BASE_URL, DEFAULT_OPENAI_BASE_URL } from '../../llm-model';
import type { BifrostKey, BifrostProvider, BifrostProviderConfig } from '../types';
import { getOrigin } from './utils';

function buildKey(
  provider: BifrostProvider,
  providerKey: LlmProviderKeyWithModels,
  value: string,
  extra?: Partial<BifrostKey>,
): BifrostKey {
  const activeMappings = providerKey.models.filter(({ model }) => !model.isDeleted);
  const modelMappings = activeMappings.flatMap(({ model, upstreamModelName }) => {
    const bifrostModelName = getBifrostModelName(model.name);
    const bifrostUpstreamModelName = getBifrostModelName(upstreamModelName);
    return [[bifrostModelName, bifrostUpstreamModelName]] as const;
  });
  return {
    name: providerKey.name.toLowerCase(),
    value,
    models: [...new Set(modelMappings.map(([modelName]) => modelName))].sort(),
    aliases: Object.fromEntries(modelMappings),
    weight: providerKey.weight,
    enabled: providerKey.isEnabled,
    ...extra,
  };
}

function getBifrostModelName(modelName: string): string {
  return modelName.replace(/^anthropic\//, '');
}

export function buildAzureProviderConfig(
  providerKey: LlmProviderKeyWithModels,
): BifrostProviderConfig | undefined {
  const settings = providerKey.settings;
  if (settings.provider !== 'azure') return undefined;
  const endpoint = getOrigin(settings.baseUrl);
  if (!endpoint) return undefined;
  return {
    provider: 'azure',
    keys: [
      buildKey('azure', providerKey, settings.apiKey, {
        azure_key_config: { endpoint },
      }),
    ],
  };
}

export function buildOpenAiProviderConfig(
  providerKey: LlmProviderKeyWithModels,
): BifrostProviderConfig | undefined {
  const settings = providerKey.settings;
  if (settings.provider !== 'openai') return undefined;
  return {
    provider: 'openai',
    ...(settings.baseUrl !== DEFAULT_OPENAI_BASE_URL
      ? {
          network_config: {
            base_url: settings.baseUrl,
            ...(isMockLlmBaseUrl(settings.baseUrl) ? { allow_private_network: true } : {}),
          },
        }
      : {}),
    keys: [buildKey('openai', providerKey, settings.apiKey)],
  };
}

export function buildIonosProviderConfig(
  providerKey: LlmProviderKeyWithModels,
): BifrostProviderConfig | undefined {
  const settings = providerKey.settings;
  if (settings.provider !== 'ionos') return undefined;
  return {
    provider: 'ionos',
    network_config: { base_url: getOrigin(settings.baseUrl) ?? getOrigin(DEFAULT_IONOS_BASE_URL) },
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
    keys: [buildKey('ionos', providerKey, settings.apiKey)],
  };
}

export function buildVertexProviderConfig(
  providerKey: LlmProviderKeyWithModels,
): BifrostProviderConfig | undefined {
  const settings = providerKey.settings;
  if (settings.provider !== 'google' || settings.authCredentials === undefined) return undefined;
  const authCredentials =
    typeof settings.authCredentials === 'string'
      ? settings.authCredentials
      : JSON.stringify(settings.authCredentials);
  return {
    provider: 'vertex',
    keys: [
      buildKey('vertex', providerKey, '', {
        vertex_key_config: {
          project_id: settings.projectId,
          region: settings.location,
          auth_credentials: authCredentials,
        },
      }),
    ],
  };
}

function isMockLlmBaseUrl(baseUrl: string): boolean {
  try {
    return new URL(baseUrl).port === '6556';
  } catch {
    return false;
  }
}
