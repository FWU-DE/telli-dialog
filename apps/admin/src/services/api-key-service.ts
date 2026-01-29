import { env } from '../consts/env';
import { ApiKey, ApiKeyWithPlainKey, CreateApiKey, UpdateApiKey } from '../types/api-key';
import { fetchFromApi } from './fetch';
import { logInfo } from '@shared/logging';

const apiRoutes = {
  GET_ALL: (organizationId: string, projectId: string) =>
    `/v1/admin/organizations/${organizationId}/projects/${projectId}/api-keys`,
  GET_SINGLE: (organizationId: string, projectId: string, apiKeyId: string) =>
    `/v1/admin/organizations/${organizationId}/projects/${projectId}/api-keys/${apiKeyId}`,
  CREATE: (organizationId: string, projectId: string) =>
    `/v1/admin/organizations/${organizationId}/projects/${projectId}/api-keys`,
  PATCH_SINGLE: (organizationId: string, projectId: string, apiKeyId: string) =>
    `/v1/admin/organizations/${organizationId}/projects/${projectId}/api-keys/${apiKeyId}`,
};

export async function fetchApiKeys(organizationId: string, projectId: string): Promise<ApiKey[]> {
  const response = await fetchFromApi(
    env.telliApiBaseUrl + apiRoutes.GET_ALL(organizationId, projectId),
  );

  const data = await response.json();
  return data as ApiKey[];
}

export async function fetchSingleApiKey(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
): Promise<ApiKey> {
  const response = await fetchFromApi(
    env.telliApiBaseUrl + apiRoutes.GET_SINGLE(organizationId, projectId, apiKeyId),
  );

  const data = await response.json();
  return data as ApiKey;
}

export async function createApiKey(
  organizationId: string,
  projectId: string,
  apiKeyData: CreateApiKey,
): Promise<ApiKeyWithPlainKey> {
  const response = await fetchFromApi(
    env.telliApiBaseUrl + apiRoutes.CREATE(organizationId, projectId),
    {
      method: 'POST',
      body: JSON.stringify(apiKeyData),
    },
  );

  logInfo('API Key was created successfully', { projectId, apiKeyData });

  const data = await response.json();
  return data as ApiKeyWithPlainKey;
}

export async function updateApiKey(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
  apiKeyData: UpdateApiKey,
): Promise<ApiKey> {
  const response = await fetchFromApi(
    env.telliApiBaseUrl + apiRoutes.PATCH_SINGLE(organizationId, projectId, apiKeyId),
    {
      method: 'PATCH',
      body: JSON.stringify(apiKeyData),
    },
  );

  logInfo('API Key was updated successfully', { projectId, apiKeyId, apiKeyData });

  const data = await response.json();
  return data as ApiKey;
}
