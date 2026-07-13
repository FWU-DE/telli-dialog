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
 * ignored: they remain in the DB for history/admin visibility but must not be routable.
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

  try {
    await Promise.all(
      providerConfigs.map((providerConfig) => syncBifrostProvider(bifrostAdminUrl, providerConfig)),
    );
  } catch (error) {
    logError('Error syncing Bifrost providers', error, {
      organizationId,
      providers: providerConfigs.map(({ provider }) => provider),
    });
    throw new BifrostProviderSyncError();
  }
}
