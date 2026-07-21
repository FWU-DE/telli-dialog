import { dbGetAllModelsByOrganizationId } from '@ais-chat/api-database';
import { env } from '@/consts/env';
import { BifrostProviderSyncError } from '@/types/bifrost-provider-sync-error';
import { logError, logInfo } from '@shared/logging';
import { syncBifrostProvider } from './client';
import { buildBifrostProviderConfigs } from './provider-config-builder';

/**
 * Mirrors the admin API DB model/provider configuration into Bifrost.
 *
 * This is called from the existing admin save flows so Bifrost stays aligned with the
 * model definitions that are copied into the app DB. Deleted models are intentionally
 * ignored: they remain in the DB for history/admin visibility but should not be synced to bifrost.
 */
export async function syncBifrostProvidersForOrganization(organizationId: string): Promise<void> {
  const bifrostAdminUrl = env.bifrostAdminUrl;
  if (!bifrostAdminUrl) {
    logInfo('Bifrost provider sync skipped because BIFROST_ADMIN_URL is not configured', {
      organizationId,
    });
    return;
  }

  const models = (await dbGetAllModelsByOrganizationId(organizationId)).filter(
    (model) => !model.isDeleted,
  );
  const providerConfigs = buildBifrostProviderConfigs(models);

  const failedProviders: string[] = [];

  for (const providerConfig of providerConfigs) {
    try {
      await syncBifrostProvider(bifrostAdminUrl, providerConfig);
    } catch (error) {
      failedProviders.push(providerConfig.provider);
      logError('Error syncing Bifrost provider', error, {
        organizationId,
        provider: providerConfig.provider,
      });
    }
  }

  if (failedProviders.length > 0) {
    logError('Error syncing Bifrost providers', undefined, {
      organizationId,
      providers: failedProviders,
    });
    throw new BifrostProviderSyncError();
  }
}
