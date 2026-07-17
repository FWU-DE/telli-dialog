import { BifrostProviderModel, BifrostProviderConfig } from '../types';
import {
  buildAzureProviderConfigs,
  buildIonosProviderConfigs,
  buildOpenAiProviderConfigs,
  buildVertexProviderConfigs,
} from './providers';

export function buildBifrostProviderConfigs(
  models: BifrostProviderModel[],
): BifrostProviderConfig[] {
  const providerModels = new Map<string, BifrostProviderModel[]>();

  for (const model of models) {
    const provider = getBifrostProviderFromSettings(model.setting.provider);
    if (!provider) continue;
    providerModels.set(provider, [...(providerModels.get(provider) ?? []), model]);
  }

  return [...providerModels.entries()].flatMap(([provider, providerModels]) =>
    buildBifrostProviderConfig(provider, providerModels),
  );
}

function buildBifrostProviderConfig(provider: string, models: BifrostProviderModel[]) {
  if (provider === 'azure') return buildAzureProviderConfigs(models);
  if (provider === 'openai') return buildOpenAiProviderConfigs(models);
  if (provider === 'ionos') return buildIonosProviderConfigs(models);
  if (provider === 'vertex') return buildVertexProviderConfigs(models);
  return [];
}

function getBifrostProviderFromSettings(provider: string): string | undefined {
  if (provider === 'azure') return 'azure';
  if (provider === 'openai') return 'openai';
  if (provider === 'ionos') return 'ionos';
  if (provider === 'google') return 'vertex';
  return undefined;
}
