'use server';

import { fetchApiKeys, createApiKey, updateApiKey, fetchSingleApiKey } from '@/services/api-key-service';
import { ApiKey, ApiKeyWithPlainKey } from '@/types/api-key';

export async function getApiKeysAction(organizationId: string, projectId: string): Promise<ApiKey[]> {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  // Todo: error handling
  return fetchApiKeys(organizationId, projectId);
}

export async function getApiKeyByIdAction(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
): Promise<ApiKey> {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  // Todo: error handling
  return fetchSingleApiKey(organizationId, projectId, apiKeyId);
}

export async function createApiKeyAction(
  organizationId: string,
  projectId: string,
  name: string,
  state?: 'active' | 'inactive' | 'deleted',
  limitInCent?: number,
  expiresAt?: Date | null,
): Promise<ApiKeyWithPlainKey> {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  if (!name.trim()) {
    throw new Error('API-Schlüssel-Name ist erforderlich');
  }

  try {
    return await createApiKey(organizationId, projectId, {
      name: name.trim(),
      state,
      limitInCent,
      expiresAt,
    });
  } catch (error) {
    throw new Error('Fehler beim Erstellen des API-Schlüssels');
  }
}

export async function updateApiKeyAction(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
  name: string,
  state?: 'active' | 'inactive' | 'deleted',
  limitInCent?: number,
  expiresAt?: Date | null,
): Promise<ApiKey> {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  if (!name.trim()) {
    throw new Error('API-Schlüssel-Name ist erforderlich');
  }

  try {
    return await updateApiKey(organizationId, projectId, apiKeyId, {
      name: name.trim(),
      state,
      limitInCent,
      expiresAt,
    });
  } catch (error) {
    throw new Error('Fehler beim Aktualisieren des API-Schlüssels');
  }
}