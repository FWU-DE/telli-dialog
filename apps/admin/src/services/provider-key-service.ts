import {
  dbCreateProviderKey,
  dbGetAllModelsByOrganizationId,
  dbGetOrganizationById,
  dbGetProviderKeysWithModelsByOrganizationId,
  dbReplaceProviderKeyModelMappings,
  dbUpdateProviderKey,
} from '@ais-chat/api-database';
import { llmModelSettingsSchema } from '@ais-chat/api-database/llm-model';
import { logInfo } from '@shared/logging';
import type { SaveProviderKey } from '@/types/provider-key';
import { syncBifrostProvidersForOrganization } from './bifrost-provider-sync-service';

export async function getProviderKeys(organizationId: string) {
  return dbGetProviderKeysWithModelsByOrganizationId(organizationId);
}

function parseSettings(provider: string, value: string) {
  const settings = llmModelSettingsSchema.parse(JSON.parse(value));
  if (settings.provider !== provider) {
    throw new Error('The settings provider must match the selected provider');
  }
  return settings;
}

async function validateModelAssignments(organizationId: string, models: SaveProviderKey['models']) {
  const organizationModels = await dbGetAllModelsByOrganizationId(organizationId);
  const organizationModelIds = new Set(organizationModels.map(({ id }) => id));
  if (models.some(({ modelId }) => !organizationModelIds.has(modelId))) {
    throw new Error('Provider keys can only be assigned to models in the same organization');
  }
}

export async function createProviderKey(organizationId: string, data: SaveProviderKey) {
  const organization = await dbGetOrganizationById(organizationId);
  if (!organization) throw new Error('Organization not found');
  await validateModelAssignments(organizationId, data.models);

  const providerKey = await dbCreateProviderKey({
    organizationId,
    name: data.name,
    provider: data.provider,
    settings: parseSettings(data.provider, data.settings),
    weight: data.weight,
    isEnabled: data.isEnabled,
  });
  if (!providerKey) throw new Error('Failed to create provider key');

  await dbReplaceProviderKeyModelMappings({
    providerKeyId: providerKey.id,
    organizationId,
    models: data.models,
  });
  await syncBifrostProvidersForOrganization(organizationId);
  logInfo('Provider key was created successfully', {
    organizationId,
    providerKeyId: providerKey.id,
  });
  return providerKey;
}

export async function updateProviderKey(
  organizationId: string,
  providerKeyId: string,
  data: SaveProviderKey,
) {
  const providerKeys = await getProviderKeys(organizationId);
  if (!providerKeys.some(({ id }) => id === providerKeyId)) {
    throw new Error('Provider key not found');
  }
  await validateModelAssignments(organizationId, data.models);

  const providerKey = await dbUpdateProviderKey(providerKeyId, organizationId, {
    name: data.name,
    provider: data.provider,
    settings: parseSettings(data.provider, data.settings),
    weight: data.weight,
    isEnabled: data.isEnabled,
  });
  if (!providerKey) throw new Error('Failed to update provider key');

  await dbReplaceProviderKeyModelMappings({
    providerKeyId,
    organizationId,
    models: data.models,
  });
  await syncBifrostProvidersForOrganization(organizationId);
  logInfo('Provider key was updated successfully', { organizationId, providerKeyId });
  return providerKey;
}
