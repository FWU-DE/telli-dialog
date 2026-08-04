import {
  dbGetAllModelsByOrganizationId,
  dbCreateLlmModel,
  dbUpdateLlmModel,
  dbGetOrganizationById,
} from '@ais-chat/api-database';
import { CreateLargeLanguageModel, UpdateLargeLanguageModel } from '../types/large-language-model';
import { logInfo } from '@shared/logging';
import { dbUpdateLlmModelsForAllFederalStates } from '@shared/db/functions/llm-model';
import { syncBifrostProvidersForOrganization } from './bifrost-provider-sync-service';

export async function getLargeLanguageModels(organizationId: string) {
  return dbGetAllModelsByOrganizationId(organizationId);
}

export async function createLargeLanguageModel(
  organizationId: string,
  data: CreateLargeLanguageModel,
) {
  const organization = await dbGetOrganizationById(organizationId);
  if (!organization) throw new Error('Organization not found');
  const existingModels = await dbGetAllModelsByOrganizationId(organizationId);
  if (existingModels.some(({ name }) => name === data.name)) {
    throw new Error('A model with this name already exists for this organization');
  }

  const model = await dbCreateLlmModel({
    name: data.name,
    displayName: data.displayName,
    provider: 'bifrost',
    description: data.description ?? '',
    setting: { provider: 'bifrost' },
    priceMetadata: data.priceMetadata
      ? JSON.parse(data.priceMetadata)
      : { type: 'text' as const, completionTokenPrice: 0, promptTokenPrice: 0 },
    supportedImageFormats: data.supportedImageFormats ? JSON.parse(data.supportedImageFormats) : [],
    additionalParameters: data.additionalParameters ? JSON.parse(data.additionalParameters) : {},
    organizationId,
    isNew: data.isNew,
    isDeleted: data.isDeleted,
  });

  await syncBifrostProvidersForOrganization(organizationId);

  logInfo('LLM was created successfully', { organizationId, data });

  if (!model) throw new Error('Failed to create model');
  return model;
}

export async function updateLargeLanguageModel(
  organizationId: string,
  modelId: string,
  data: UpdateLargeLanguageModel,
) {
  const existingModels = await dbGetAllModelsByOrganizationId(organizationId);
  if (existingModels.some(({ id, name }) => id !== modelId && name === data.name)) {
    throw new Error('A model with this name already exists for this organization');
  }

  const model = await dbUpdateLlmModel(modelId, organizationId, {
    name: data.name,
    displayName: data.displayName,
    provider: 'bifrost',
    description: data.description,
    setting: { provider: 'bifrost' },
    priceMetadata: data.priceMetadata ? JSON.parse(data.priceMetadata) : undefined,
    supportedImageFormats: data.supportedImageFormats
      ? JSON.parse(data.supportedImageFormats)
      : undefined,
    additionalParameters: data.additionalParameters
      ? JSON.parse(data.additionalParameters)
      : undefined,
    isNew: data.isNew,
    isDeleted: data.isDeleted,
  });

  await syncBifrostProvidersForOrganization(organizationId);
  await dbUpdateLlmModelsForAllFederalStates();

  logInfo('LLM was updated successfully', { organizationId, modelId, data });

  if (!model) throw new Error('Failed to update model');
  return model;
}
