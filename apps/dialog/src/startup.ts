import { runDatabaseMigration } from '@shared/db';
import { dbGetFederalStates, dbUpdateFederalState } from '@shared/db/functions/federal-state';
import { decrypt } from '@shared/db/crypto';
import { env } from '@shared/env';
import {env as aiEnv} from '@telli/ai-core/env';
import { lookupApiKeys } from '@telli/ai-core/api-keys/lookup';
import { logError, logInfo } from '@shared/logging';

/**
 * Custom code that will be executed on application startup.
 */
export async function startup() {
  await runDatabaseMigration();
  await postMigration();
}

/**
 * Performs post-migration operations after database migrations have been executed.
 */
async function postMigration() {
  await tempAddApiKeyIdsToFederalStates();
}

/**
 * Temporary migration function that adds API key IDs to federal states.
 *
 * @AsamMax
 * TODO: delete after executing in production once
 *
 * @returns A promise that resolves when all federal states have been processed
 */
async function tempAddApiKeyIdsToFederalStates() {
  if (!aiEnv.apiDatabaseUrl) {
    return;
  }
  // Get all federal states
  const federalStates = await dbGetFederalStates();

  // Filter states that have encrypted API key but no apiKeyId
  const statesToUpdate = federalStates.filter((state) => state.encryptedApiKey && !state.apiKeyId);

  if (statesToUpdate.length === 0) {
    logInfo('No federal states need API key ID updates');
    return;
  }

  // Decrypt API keys and create lookup dictionary
  const apiKeysByState: Record<string, string> = {};
  for (const state of statesToUpdate) {
    try {
      apiKeysByState[state.id] = decrypt({
        data: state.encryptedApiKey!,
        plainEncryptionKey: env.encryptionKey,
      });
    } catch (error) {
      logError(`Failed to decrypt API key for federal state ${state.id}`, error);
    }
  }

  // Lookup API key IDs
  const apiKeyIdsByState = await lookupApiKeys(apiKeysByState);

  // Update federal states with their API key IDs
  for (const state of statesToUpdate) {
    if (apiKeyIdsByState[state.id]) {
      try {
        await dbUpdateFederalState({
          id: state.id,
          apiKeyId: apiKeyIdsByState[state.id],
        });
        logInfo(`Updated federal state ${state.id} with API key ID ${apiKeyIdsByState[state.id]}`);
      } catch (error) {
        logError(`Failed to update federal state ${state.id}`, error);
      }
    } else {
      logInfo(`No API key ID found for federal state ${state.id}`);
    }
  }

  logInfo(`Completed API key ID updates for ${statesToUpdate.length} federal states`);
}
