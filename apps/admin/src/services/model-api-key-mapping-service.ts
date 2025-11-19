import { env } from '../consts/env';
import { ModelApiKeyMapping } from '../types/model-mappings';
import { fetchFromApi } from './fetch';

const apiRoutes = {
  GET_ALL: (organizationId: string, projectId: string, apiKeyId: string) =>
    `/v1/admin/organizations/${organizationId}/projects/${projectId}/api-keys/${apiKeyId}/model-mappings`,
  UPDATE_ALL: (organizationId: string, projectId: string, apiKeyId: string) =>
    `/v1/admin/organizations/${organizationId}/projects/${projectId}/api-keys/${apiKeyId}/model-mappings`,
};

export async function fetchModelApiKeyMappings(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
): Promise<ModelApiKeyMapping[]> {
  const response = await fetchFromApi(
    env.telliApiBaseUrl + apiRoutes.GET_ALL(organizationId, projectId, apiKeyId),
  );

  const data = await response.json();

  return data as ModelApiKeyMapping[];
}

export async function saveModelApiKeyMappings(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
  modelIds: string[],
): Promise<ModelApiKeyMapping[]> {
  const response = await fetchFromApi(
    env.telliApiBaseUrl + apiRoutes.UPDATE_ALL(organizationId, projectId, apiKeyId),
    {
      method: 'PUT',
      body: JSON.stringify({ modelIds }),
    },
  );

  const data = await response.json();

  return data as ModelApiKeyMapping[];
}
