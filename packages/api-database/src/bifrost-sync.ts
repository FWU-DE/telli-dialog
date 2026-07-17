import {
  type BifrostProviderModel,
  syncBifrostProvidersForModels,
} from '@ais-chat/shared-core/bifrost-sync';
import type { LlmModel } from './schema';

export async function syncApiDatabaseModelsToBifrost(models: LlmModel[]): Promise<void> {
  const bifrostAdminUrl = process.env.BIFROST_ADMIN_URL;
  if (!bifrostAdminUrl) {
    throw new Error('BIFROST_ADMIN_URL is not set');
  }

  await syncBifrostProvidersForModels({
    bifrostAdminUrl,
    bifrostManagementApiKey: process.env.BIFROST_MANAGEMENT_API_KEY,
    models: models
      .filter((model) => model.provider === 'bifrost')
      .map((model) => toBifrostProviderModel(model)),
  });
}

function toBifrostProviderModel(model: LlmModel): BifrostProviderModel {
  return {
    provider: model.provider,
    name: model.name,
    setting: model.setting,
    additionalParameters: model.additionalParameters,
    supportedImageFormats: model.supportedImageFormats,
    isDeleted: model.isDeleted,
  };
}
