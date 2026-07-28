import { syncBifrostProvidersForOrganization as syncBifrostProvidersForOrganizationInDatabase } from '@ais-chat/api-database/bifrost-provider-sync';
import { env } from '@/consts/env';
import { logError, logInfo, logWarning } from '@shared/logging';

export async function syncBifrostProvidersForOrganization(organizationId: string): Promise<void> {
  await syncBifrostProvidersForOrganizationInDatabase(organizationId, {
    bifrostAdminUrl: env.bifrostAdminUrl,
    bifrostManagementApiKey: env.bifrostManagementApiKey,
    logger: {
      info: logInfo,
      warning: logWarning,
      error: logError,
    },
  });
}
