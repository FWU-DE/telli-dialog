import { dbGetAllModelsByOrganizationId } from '../functions';
import { LlmModel } from '../schema';
import { BifrostProviderSyncError } from './error';
import { syncBifrostProvider } from './client';
import { buildBifrostProviderConfigs } from './provider-config-builder';
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

  const syncResults = await Promise.allSettled(
    providerConfigs.map(async (providerConfig) => {
      await syncBifrostProvider({
        bifrostAdminUrl,
        bifrostManagementApiKey,
        providerConfig,
        logger,
      });
      return providerConfig.provider;
    }),
  );
  const failedProviders = syncResults.flatMap((result, index) => {
    if (result.status === 'fulfilled') return [];
    return [providerConfigs[index]?.provider ?? 'unknown'];
  });

  if (failedProviders.length > 0) {
    for (const [index, result] of syncResults.entries()) {
      if (result.status === 'rejected') {
        logger?.error?.('Error syncing Bifrost provider', result.reason, {
          provider: providerConfigs[index]?.provider ?? 'unknown',
        });
      }
    }

    logger?.error?.('Error syncing Bifrost providers', undefined, {
      providers: failedProviders,
    });
    throw new BifrostProviderSyncError();
  }
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
