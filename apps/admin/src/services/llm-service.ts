import {
  dbGetAllModelsByOrganizationId,
  dbCreateLlmModel,
  dbUpdateLlmModel,
  dbGetOrganizationById,
} from '@telli/api-database';
import { CreateLargeLanguageModel, UpdateLargeLanguageModel } from '../types/large-language-model';
import { logInfo } from '@shared/logging';

export async function fetchLargeLanguageModels(organizationId: string) {
  return dbGetAllModelsByOrganizationId(organizationId);
}

export async function createLargeLanguageModel(
  organizationId: string,
  data: CreateLargeLanguageModel,
) {
  const organization = await dbGetOrganizationById(organizationId);
  if (!organization) throw new Error('Organization not found');

  const model = await dbCreateLlmModel({
    name: data.name,
    displayName: data.displayName,
    provider: data.provider,
    description: data.description ?? '',
    setting: data.setting ? JSON.parse(data.setting) : {},
    priceMetadata: data.priceMetadata
      ? JSON.parse(data.priceMetadata)
      : { type: 'text' as const, completionTokenPrice: 0, promptTokenPrice: 0 },
    supportedImageFormats: data.supportedImageFormats ? JSON.parse(data.supportedImageFormats) : [],
    additionalParameters: data.additionalParameters ? JSON.parse(data.additionalParameters) : {},
    organizationId,
    isNew: data.isNew,
    isDeleted: data.isDeleted,
  });

  logInfo('LLM was created successfully', { organizationId, data });

  if (!model) throw new Error('Failed to create model');
  return model;
}

export async function updateLargeLanguageModel(
  organizationId: string,
  modelId: string,
  data: UpdateLargeLanguageModel,
) {
  const model = await dbUpdateLlmModel(modelId, organizationId, {
    name: data.name,
    displayName: data.displayName,
    provider: data.provider,
    description: data.description,
    setting: data.setting ? JSON.parse(data.setting) : undefined,
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

  logInfo('LLM was updated successfully', { organizationId, modelId, data });

  if (!model) throw new Error('Failed to update model');
  return model;
}
