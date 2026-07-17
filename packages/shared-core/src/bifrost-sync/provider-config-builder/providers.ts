import { BifrostProviderModel, BifrostProviderConfig } from '../types';
import type { BifrostSecret } from '../types';
import {
  buildAzureAliases,
  buildBifrostKey,
  buildSingleKeyProviderConfigs,
  getOrigin,
  parseAzureBaseUrl,
} from './utils';

function stripAnthropicPrefix(modelName: string): string {
  return modelName.replace(/^anthropic\//, '');
}

export function buildAzureProviderConfigs(models: BifrostProviderModel[]): BifrostProviderConfig[] {
  return buildSingleKeyProviderConfigs({
    provider: 'azure',
    models,
    getGroupKey: (setting) => {
      if (setting.provider !== 'azure') return undefined;
      const azureUrl = parseAzureBaseUrl(setting.baseUrl ?? '');
      if (!azureUrl) return undefined;
      return `${setting.apiKey}:${azureUrl.endpoint}`;
    },
    buildKey: (setting, groupedModels) => {
      if (setting.provider !== 'azure') throw new Error('Invalid Bifrost model setting');
      const azureUrl = parseAzureBaseUrl(setting.baseUrl ?? '');
      if (!azureUrl) throw new Error('Invalid Azure base URL');

      return buildBifrostKey({
        provider: 'azure',
        readableValue: azureUrl.endpoint,
        uniqueValue: setting.apiKey ?? '',
        value: setting.apiKey ?? '',
        groupedModels,
        extra: {
          aliases: buildAzureAliases(groupedModels),
          azure_key_config: { endpoint: azureUrl.endpoint },
        },
      });
    },
  });
}

export function buildOpenAiProviderConfigs(
  models: BifrostProviderModel[],
): BifrostProviderConfig[] {
  return buildSingleKeyProviderConfigs({
    provider: 'openai',
    models,
    getGroupKey: (setting) => {
      if (setting.provider !== 'openai') return undefined;
      return `${setting.apiKey}:${setting.baseUrl}`;
    },
    buildConfig: (setting) => {
      if (setting.provider !== 'openai') throw new Error('Invalid Bifrost model setting');
      return setting.baseUrl && setting.baseUrl !== 'https://api.openai.com/v1'
        ? { network_config: { base_url: setting.baseUrl } }
        : {};
    },
    buildKey: (setting, groupedModels) => {
      if (setting.provider !== 'openai') throw new Error('Invalid Bifrost model setting');
      return buildBifrostKey({
        provider: 'openai',
        readableValue: setting.baseUrl ?? '',
        uniqueValue: setting.apiKey ?? '',
        value: setting.apiKey ?? '',
        groupedModels,
      });
    },
  });
}

export function buildIonosProviderConfigs(models: BifrostProviderModel[]): BifrostProviderConfig[] {
  return buildSingleKeyProviderConfigs({
    provider: 'ionos',
    models,
    getGroupKey: (setting) => {
      if (setting.provider !== 'ionos') return undefined;
      return `${setting.apiKey}:${setting.baseUrl}`;
    },
    buildConfig: (setting) => {
      if (setting.provider !== 'ionos') throw new Error('Invalid Bifrost model setting');
      return {
        network_config: {
          base_url: getOrigin(setting.baseUrl ?? '') ?? undefined,
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
      if (setting.provider !== 'ionos') throw new Error('Invalid Bifrost model setting');
      return buildBifrostKey({
        provider: 'ionos',
        readableValue: setting.baseUrl ?? '',
        uniqueValue: setting.apiKey ?? '',
        value: setting.apiKey ?? '',
        groupedModels,
      });
    },
  });
}

export function buildVertexProviderConfigs(
  models: BifrostProviderModel[],
): BifrostProviderConfig[] {
  return buildSingleKeyProviderConfigs({
    provider: 'vertex',
    models,
    getGroupKey: (setting) => {
      if (setting.provider !== 'google') return undefined;
      return `${setting.projectId}:${setting.location}`;
    },
    buildKey: (setting, groupedModels) => {
      if (setting.provider !== 'google') throw new Error('Invalid Bifrost model setting');
      const authCredentials = normalizeAuthCredentials(setting.authCredentials);
      const modelNames = [
        ...new Set(groupedModels.map((model) => stripAnthropicPrefix(model.name))),
      ].sort();
      return buildBifrostKey({
        provider: 'vertex',
        readableValue: `${setting.projectId}-${setting.location}`,
        uniqueValue: setting.projectId ?? '',
        value: '',
        groupedModels,
        extra: {
          vertex_key_config: {
            project_id: setting.projectId ?? '',
            region: setting.location ?? '',
            ...(authCredentials !== undefined ? { auth_credentials: authCredentials } : {}),
          },
          models: modelNames,
        },
      });
    },
  });
}

function normalizeAuthCredentials(value: unknown): BifrostSecret | undefined {
  if (value === undefined || value === null) return undefined;
  return value as BifrostSecret;
}
