'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { getLargeLanguageModels } from '@/services/llm-service';
import {
  getModelApiKeyMappings,
  saveModelApiKeyMappings,
} from '@/services/model-api-key-mapping-service';

export async function getModelMappingsAction(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
) {
  await requireAdminAuth();

  return getModelApiKeyMappings(organizationId, projectId, apiKeyId);
}

export async function getLargeLanguageModelsAction(organizationId: string) {
  await requireAdminAuth();

  return getLargeLanguageModels(organizationId);
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
