'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { fetchLargeLanguageModels } from '@/services/llm-service';
import {
  fetchModelApiKeyMappings,
  saveModelApiKeyMappings,
} from '@/services/model-api-key-mapping-service';

export async function getModelMappingsAction(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
) {
  await requireAdminAuth();
  
  return fetchModelApiKeyMappings(organizationId, projectId, apiKeyId);
}

export async function getLargeLanguageModelsAction(organizationId: string) {
  await requireAdminAuth();
  
  return fetchLargeLanguageModels(organizationId);
}

export async function saveModelMappingsAction(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
  modelIds: string[],
) {
  await requireAdminAuth();
  
  return saveModelApiKeyMappings(organizationId, projectId, apiKeyId, modelIds);
}
