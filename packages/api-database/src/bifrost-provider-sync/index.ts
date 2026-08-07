import { dbGetAllProviderKeysWithModels, type LlmProviderKeyWithModels } from '../functions';
import { BifrostProviderSyncError } from './error';
import { syncBifrostProvider } from './client';
import { buildBifrostProviderConfigs } from './provider-config-builder';
import { ensureBifrostVirtualKeyProviderAccess } from './virtual-key-sync';
import {
  BIFROST_PROVIDERS,
  type BifrostProviderConfig,
  type BifrostProviderSyncOptions,
} from './types';

/**
 * Mirrors API DB model/provider configuration into Bifrost.
 *
 * Deleted models are intentionally ignored: they remain in the DB for history/admin
 * visibility but should not be synced to Bifrost.
 */
export async function syncBifrostProviders(
  providerKeys: LlmProviderKeyWithModels[],
  options: BifrostProviderSyncOptions,
): Promise<void> {
  const { bifrostAdminUrl, bifrostAdminUsername, bifrostAdminPassword, logger } = options;
  if (!bifrostAdminUrl) {
    logger?.info?.('Bifrost provider sync skipped because BIFROST_ADMIN_URL is not configured');
    return;
  }

  const providerConfigs = buildBifrostProviderConfigs(providerKeys, logger);

  const failedProviders: string[] = [];

  for (const providerConfig of providerConfigs) {
    try {
      await syncBifrostProvider({
        bifrostAdminUrl,
        bifrostAdminUsername,
        bifrostAdminPassword,
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

  await deleteEmptyManagedProviders(providerConfigs, options);

  await ensureBifrostVirtualKeyProviderAccess({
    bifrostAdminUrl,
    bifrostAdminUsername,
    bifrostAdminPassword,
    logger,
  });
}

async function deleteEmptyManagedProviders(
  providerConfigs: BifrostProviderConfig[],
  options: BifrostProviderSyncOptions,
): Promise<void> {
  const configuredProviders = new Set(providerConfigs.map(({ provider }) => provider));
  const emptyProviderConfigs = BIFROST_PROVIDERS.filter(
    (provider) => !configuredProviders.has(provider),
  ).map((provider) => ({ provider, keys: [] }) satisfies BifrostProviderConfig);
  for (const providerConfig of emptyProviderConfigs) {
    await syncBifrostProvider({
      bifrostAdminUrl: options.bifrostAdminUrl!,
      bifrostAdminUsername: options.bifrostAdminUsername,
      bifrostAdminPassword: options.bifrostAdminPassword,
      providerConfig,
      logger: options.logger,
    });
  }
}

export async function syncBifrostProvidersForOrganization(
  organizationId: string,
  options: BifrostProviderSyncOptions,
): Promise<void> {
  // Bifrost provider configuration and virtual keys are shared across organizations. Rebuild the
  // complete desired state so syncing one organization cannot remove another organization's keys.
  const providerKeys = await dbGetAllProviderKeysWithModels();
  await syncBifrostProviders(providerKeys, {
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

export async function syncAllBifrostProviders(options: BifrostProviderSyncOptions): Promise<void> {
  await syncBifrostProviders(await dbGetAllProviderKeysWithModels(), options);
}

export * from './error';
export * from './types';
export { buildBifrostProviderConfigs } from './provider-config-builder';
export { ensureBifrostVirtualKeyProviderAccess } from './virtual-key-sync';
