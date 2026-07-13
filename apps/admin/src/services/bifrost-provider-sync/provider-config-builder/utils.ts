import { LlmModel } from '@ais-chat/api-database';
import { BifrostProviderSyncError } from '@/types/bifrost-provider-sync-error';
import { buildKeyName } from '../key-name';
import {
  BifrostKey,
  BifrostProvider,
  BifrostProviderConfig,
  BifrostProviderConfigFields,
  BifrostSecret,
} from '../types';

type ProviderSettings = LlmModel['setting'];

export function buildSingleKeyProviderConfigs({
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

export function buildBifrostKey({
  provider,
  readableValue,
  uniqueValue,
  value,
  groupedModels,
  extra,
}: {
  provider: BifrostProvider;
  readableValue: string;
  uniqueValue: BifrostSecret;
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

export function buildAzureAliases(groupedModels: LlmModel[]): Record<string, string> {
  return Object.fromEntries(
    groupedModels.flatMap((model) => {
      const parsedUrl =
        model.setting.provider === 'azure' ? parseAzureBaseUrl(model.setting.baseUrl) : undefined;
      return parsedUrl ? [[model.name, parsedUrl.deployment]] : [];
    }),
  );
}

export function getOrigin(value: string): string | undefined {
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

export function parseAzureBaseUrl(
  baseUrl: string,
): { endpoint: string; deployment: string } | undefined {
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

function getModelNames(models: LlmModel[]): string[] {
  return [...new Set(models.map(({ name }) => name))].sort();
}
