import { BifrostProviderModel } from './types';
import { buildBifrostProviderConfigs } from './provider-config-builder';
import { syncBifrostProvider } from './client';

export async function syncBifrostProvidersForModels({
  bifrostAdminUrl,
  bifrostManagementApiKey,
  models,
}: {
  bifrostAdminUrl: string;
  bifrostManagementApiKey?: string;
  models: BifrostProviderModel[];
}): Promise<void> {
  const providerConfigs = buildBifrostProviderConfigs(models.filter((model) => !model.isDeleted));

  for (const providerConfig of providerConfigs) {
    await syncBifrostProvider({
      bifrostAdminUrl,
      bifrostManagementApiKey,
      providerConfig,
    });
  }
}

export { buildBifrostProviderConfigs } from './provider-config-builder';
export { syncBifrostProvider } from './client';
export * from './types';
