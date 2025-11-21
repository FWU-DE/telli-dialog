'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import {
  fetchApiKeys,
  createApiKey,
  updateApiKey,
  fetchSingleApiKey,
} from '@/services/api-key-service';
import { ApiKey, ApiKeyWithPlainKey, CreateApiKey, UpdateApiKey } from '@/types/api-key';

export async function getApiKeysAction(
  organizationId: string,
  projectId: string,
): Promise<ApiKey[]> {
  await requireAdminAuth();

  return fetchApiKeys(organizationId, projectId);
}

export async function getApiKeyByIdAction(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
): Promise<ApiKey> {
  await requireAdminAuth();

  return fetchSingleApiKey(organizationId, projectId, apiKeyId);
}

export async function createApiKeyAction(
  organizationId: string,
  projectId: string,
  data: CreateApiKey,
): Promise<ApiKeyWithPlainKey> {
  await requireAdminAuth();

  if (!data.name.trim()) {
    throw new Error('API-Schlüssel-Name ist erforderlich');
  }

  try {
    return await createApiKey(organizationId, projectId, data);
  } catch {
    throw new Error('Fehler beim Erstellen des API-Schlüssels');
  }
}

export async function updateApiKeyAction(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
  data: UpdateApiKey,
): Promise<ApiKey> {
  await requireAdminAuth();

  if (!data.name.trim()) {
    throw new Error('API-Schlüssel-Name ist erforderlich');
  }

  try {
    return await updateApiKey(organizationId, projectId, apiKeyId, data);
  } catch {
    throw new Error('Fehler beim Aktualisieren des API-Schlüssels');
  }
}
