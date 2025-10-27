const apiRoutes = {
  GET_ALL: '/v1/admin/organizations/{organizationId}/projects/{projectId}/api-keys',
  GET_SINGLE: '/v1/admin/organizations/{organizationId}/projects/{projectId}/api-keys/{apiKeyId}',
};

import { env } from '../consts/env';
import { ApiKey } from '../types/api-key';

export async function fetchApiKeys(organizationId: string, projectId: string): Promise<ApiKey[]> {
  const response = await fetch(
    env.BASE_URL_TELLI_API +
      apiRoutes.GET_ALL.replace('{organizationId}', organizationId).replace(
        '{projectId}',
        projectId,
      ),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.API_KEY_TELLI_API}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.statusText}`);
  }

  const data = await response.json();

  return data as ApiKey[];
}

export async function fetchSingleApiKey(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
): Promise<ApiKey> {
  const response = await fetch(
    env.BASE_URL_TELLI_API +
      apiRoutes.GET_SINGLE.replace('{organizationId}', organizationId)
        .replace('{projectId}', projectId)
        .replace('{apiKeyId}', apiKeyId),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.API_KEY_TELLI_API}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch API keys: ${response.statusText}`);
  }

  const data = await response.json();
  return data as ApiKey;
}
