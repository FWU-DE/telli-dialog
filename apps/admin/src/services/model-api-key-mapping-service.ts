import {
  dbGetAllModelMappingsForApiKey,
  dbUpdateModelMappingsForApiKey,
} from '@telli/api-database';
import { logInfo } from '@shared/logging';

export async function fetchModelApiKeyMappings(
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
  const result = await dbUpdateModelMappingsForApiKey(organizationId, projectId, apiKeyId, modelIds);

  logInfo('API Key mapping was updated successfully', { projectId, apiKeyId, modelIds });

  return result;
}
