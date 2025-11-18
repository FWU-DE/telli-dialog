import { env } from '../consts/env';
import { ApiKey } from '../types/api-key';
import { fetchFromApi } from './fetch';

const apiRoutes = {
  GET_ALL: (organizationId: string, projectId: string) =>
    `/v1/admin/organizations/${organizationId}/projects/${projectId}/api-keys`,
  GET_SINGLE: (organizationId: string, projectId: string, apiKeyId: string) =>
    `/v1/admin/organizations/${organizationId}/projects/${projectId}/api-keys/${apiKeyId}`,
  CREATE: (organizationId: string, projectId: string) =>
    `/v1/admin/organizations/${organizationId}/projects/${projectId}/api-keys`,
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
  apiKeyData: {
    name: string;
    state?: 'active' | 'inactive' | 'deleted';
    limitInCent?: number;
    expiresAt?: Date | null;
  },
): Promise<ApiKey> {
  const response = await fetchFromApi(
    env.telliApiBaseUrl + apiRoutes.CREATE(organizationId, projectId),
    {
      method: 'POST',
      body: JSON.stringify(apiKeyData),
    },
  );

  const data = await response.json();
  return data as ApiKey;
}
