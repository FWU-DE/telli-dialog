import type { LlmProviderKeyWithModels } from '../../functions';
import type { BifrostProvider, BifrostProviderConfig, BifrostProviderSyncLogger } from '../types';
import {
  buildAzureProviderConfig,
  buildIonosProviderConfig,
  buildOpenAiProviderConfig,
  buildVertexProviderConfig,
} from './providers';

export function buildBifrostProviderConfigs(
  providerKeys: LlmProviderKeyWithModels[],
  logger?: BifrostProviderSyncLogger,
): BifrostProviderConfig[] {
  const configs = providerKeys.flatMap((providerKey) => {
    if (
      !providerKey.isEnabled ||
      providerKey.models.every(({ model }) => model.isDeleted || !model.useBifrost)
    )
      return [];
    const provider = getBifrostProvider(providerKey.provider);
    if (!provider) {
      logger?.warning?.('Skipping unsupported provider for Bifrost sync', {
        provider: providerKey.provider,
        providerKeyId: providerKey.id,
      });
      return [];
    }

    const config = buildProviderConfig(provider, providerKey);
    return config ? [config] : [];
  });

  const merged = new Map<BifrostProvider, BifrostProviderConfig>();
  for (const config of configs) {
    const existing = merged.get(config.provider);
    if (!existing) {
      merged.set(config.provider, config);
      continue;
    }
    if (JSON.stringify(existing.network_config) !== JSON.stringify(config.network_config)) {
      logger?.warning?.('Multiple network configs found while syncing Bifrost provider', {
        provider: config.provider,
      });
    }
    merged.set(config.provider, { ...existing, keys: [...existing.keys, ...config.keys] });
  }
  return [...merged.values()];
}

function buildProviderConfig(
  provider: BifrostProvider,
  providerKey: LlmProviderKeyWithModels,
): BifrostProviderConfig | undefined {
  if (provider === 'azure') return buildAzureProviderConfig(providerKey);
  if (provider === 'openai') return buildOpenAiProviderConfig(providerKey);
  if (provider === 'ionos') return buildIonosProviderConfig(providerKey);
  if (provider === 'vertex') return buildVertexProviderConfig(providerKey);
}

function getBifrostProvider(provider: string): BifrostProvider | undefined {
  if (provider === 'azure' || provider === 'openai' || provider === 'ionos') return provider;
  if (provider === 'google' || provider === 'vertex') return 'vertex';
}
