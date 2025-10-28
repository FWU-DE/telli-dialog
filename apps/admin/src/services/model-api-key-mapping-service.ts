import { env } from '../consts/env';
import { ModelApiKeyMapping } from '../types/model-mappings';

const apiRoutes = {
  GET_ALL: (organizationId: string, projectId: string, apiKeyId: string) =>
    `/v1/admin/organizations/${organizationId}/projects/${projectId}/api-keys/${apiKeyId}/model-mappings`,
};

export async function fetchModelApiKeyMappings(
  organizationId: string,
  projectId: string,
  apiKeyId: string,
): Promise<ModelApiKeyMapping[]> {
  const response = await fetch(
    env.BASE_URL_TELLI_API + apiRoutes.GET_ALL(organizationId, projectId, apiKeyId),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.API_KEY_TELLI_API}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch model API key mappings: ${response.statusText}`);
  }

  const data = await response.json();

  // Todo: fix return type here
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((d: any) => d.llm_model_api_key_mapping) as ModelApiKeyMapping[];
}
