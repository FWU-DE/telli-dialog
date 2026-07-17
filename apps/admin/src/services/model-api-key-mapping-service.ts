import {
  dbGetAllModelMappingsForApiKey,
  dbUpdateModelMappingsForApiKey,
} from '@ais-chat/api-database';
import { logInfo } from '@shared/logging';
import { dbUpdateLlmModelsForAllFederalStates } from '@shared/db/functions/llm-model';
import { syncBifrostProvidersForOrganization } from './bifrost-provider-sync';

export async function getModelApiKeyMappings(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
) {
  return dbGetAllModelMappingsForApiKey(organizationId, projectId, apiKeyId);
}

export async function saveModelApiKeyMappings(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
  modelIds: string[],
) {
  const result = await dbUpdateModelMappingsForApiKey(
    organizationId,
    projectId,
    apiKeyId,
    modelIds,
  );

  await syncBifrostProvidersForOrganization(organizationId);
  await dbUpdateLlmModelsForAllFederalStates();

  logInfo('API Key mapping was updated successfully', { projectId, apiKeyId, modelIds });

  return result;
}
