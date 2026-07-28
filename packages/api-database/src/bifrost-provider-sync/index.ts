import { dbGetAllModelsByOrganizationId } from '../functions';
import { LlmModel } from '../schema';
import { BifrostProviderSyncError } from './error';
import { syncBifrostProvider } from './client';
import { buildBifrostProviderConfigs } from './provider-config-builder';
import { ensureBifrostVirtualKeyProviderAccess } from './virtual-key-sync';
import { BifrostProviderSyncOptions } from './types';

/**
 * Mirrors API DB model/provider configuration into Bifrost.
 *
 * Deleted models are intentionally ignored: they remain in the DB for history/admin
 * visibility but should not be synced to Bifrost.
 */
export async function syncBifrostProviders(
  models: LlmModel[],
  options: BifrostProviderSyncOptions,
): Promise<void> {
  const { bifrostAdminUrl, bifrostManagementApiKey, logger } = options;
  if (!bifrostAdminUrl) {
    logger?.info?.('Bifrost provider sync skipped because BIFROST_ADMIN_URL is not configured');
    return;
  }

  const providerConfigs = buildBifrostProviderConfigs(
    models.filter((model) => !model.isDeleted),
    logger,
  );

  const failedProviders: string[] = [];

  for (const providerConfig of providerConfigs) {
    try {
      await syncBifrostProvider({
        bifrostAdminUrl,
        bifrostManagementApiKey,
        providerConfig,
        logger,
      });
    } catch (error) {
      failedProviders.push(providerConfig.provider);
      logger?.error?.('Error syncing Bifrost provider', error, {
        provider: providerConfig.provider,
      });
    }
  }

  if (failedProviders.length > 0) {
    logger?.error?.('Error syncing Bifrost providers', undefined, {
      providers: failedProviders,
    });
    throw new BifrostProviderSyncError();
  }

  await ensureBifrostVirtualKeyProviderAccess({
    bifrostAdminUrl,
    bifrostManagementApiKey,
    logger,
  });
}

export async function syncBifrostProvidersForOrganization(
  organizationId: string,
  options: BifrostProviderSyncOptions,
): Promise<void> {
  const models = await dbGetAllModelsByOrganizationId(organizationId);
  await syncBifrostProviders(models, {
    ...options,
    logger: options.logger
      ? {
          ...options.logger,
          info: (message, context) =>
            options.logger?.info?.(message, { organizationId, ...context }),
          warning: (message, context) =>
            options.logger?.warning?.(message, { organizationId, ...context }),
          error: (message, error, context) =>
            options.logger?.error?.(message, error, { organizationId, ...context }),
        }
      : undefined,
  });
}

export * from './error';
export * from './types';
export { buildBifrostProviderConfigs } from './provider-config-builder';
export { ensureBifrostVirtualKeyProviderAccess } from './virtual-key-sync';
