import { env } from '../consts/env';
import { LargeLanguageModel } from '../types/large-language-model';

const apiRoutes = {
  GET_ALL: '/v1/admin/organizations/{organizationId}/models',
};

export async function fetchLargeLanguageModels(
  organizationId: string,
): Promise<LargeLanguageModel[]> {
  const response = await fetch(
    env.BASE_URL_TELLI_API + apiRoutes.GET_ALL.replace('{organizationId}', organizationId),
    {
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.API_KEY_TELLI_API}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch llms: ${response.statusText}`);
  }

  const data = await response.json();
  return data as LargeLanguageModel[];
}
