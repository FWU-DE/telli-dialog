import { dbGetAllModelsByOrganizationId } from '@ais-chat/api-database';
import {
  buildBifrostProviderConfigs,
  syncBifrostProvider,
} from '@ais-chat/shared-core/bifrost-sync';
import { env } from '@/consts/env';
import { BifrostProviderSyncError } from '@/types/bifrost-provider-sync-error';
import { logError, logInfo } from '@shared/logging';

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

  const syncResults = await Promise.allSettled(
    providerConfigs.map(async (providerConfig) => {
      await syncBifrostProvider({
        bifrostAdminUrl,
        bifrostManagementApiKey: env.bifrostManagementApiKey,
        providerConfig,
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
        logError('Error syncing Bifrost provider', result.reason, {
          organizationId,
          provider: providerConfigs[index]?.provider ?? 'unknown',
        });
      }
    }

    logError('Error syncing Bifrost providers', undefined, {
      organizationId,
      providers: failedProviders,
    });
    throw new BifrostProviderSyncError();
  }
}
