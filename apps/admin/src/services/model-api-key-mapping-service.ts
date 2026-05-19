import {
  dbGetAllModelMappingsForApiKey,
  dbUpdateModelMappingsForApiKey,
} from '@ais-chat/api-database';
import { logInfo } from '@shared/logging';
import { dbUpdateLlmModelsForAllFederalStates } from '@shared/db/functions/llm-model';

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

  logInfo('API Key mapping was updated successfully', { projectId, apiKeyId, modelIds });

  await dbUpdateLlmModelsForAllFederalStates();

  return result;
}
