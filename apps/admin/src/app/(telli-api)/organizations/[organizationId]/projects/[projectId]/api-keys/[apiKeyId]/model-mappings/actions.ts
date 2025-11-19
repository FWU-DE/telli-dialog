'use server';

import { fetchLargeLanguageModels } from "@/services/llm-service";
import { fetchModelApiKeyMappings, saveModelApiKeyMappings } from "@/services/model-api-key-mapping-service";


export async function getModelMappingsAction(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
) {
  // TODO: Add authentication check
  return fetchModelApiKeyMappings(organizationId, projectId, apiKeyId);
}

export async function getLargeLanguageModelsAction(organizationId: string) {
  // TODO: Add authentication check
  return fetchLargeLanguageModels(organizationId);
}

export async function saveModelMappingsAction(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
  modelIds: string[],
) {
  // TODO: Add authentication check
  return saveModelApiKeyMappings(organizationId, projectId, apiKeyId, modelIds);
}