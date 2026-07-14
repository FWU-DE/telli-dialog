import { LlmModel } from '@ais-chat/api-database';
import { logWarning } from '@shared/logging';
import {
  buildAzureProviderConfigs,
  buildIonosProviderConfigs,
  buildOpenAiProviderConfigs,
  buildVertexProviderConfigs,
} from './providers';
import { BifrostProvider, BifrostProviderConfig } from '../types';

/**
 * Converts API DB model rows into Bifrost provider/key configuration.
 *
 * The app-facing `model.provider` may be `bifrost`, but the upstream provider is always read
 * from `model.setting.provider`. This lets admins switch runtime routing without rewriting the
 * provider-specific settings JSON.
 */
export function buildBifrostProviderConfigs(models: LlmModel[]): BifrostProviderConfig[] {
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

function getBifrostProviderFromSettings(provider: string): BifrostProvider | undefined {
  if (provider === 'azure') return 'azure';
  if (provider === 'openai') return 'openai';
  if (provider === 'ionos') return 'ionos';
  if (provider === 'google') return 'vertex';
  return undefined;
}
