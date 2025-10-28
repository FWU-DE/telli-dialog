import { env } from '../consts/env';
import { LargeLanguageModel } from '../types/large-language-model';
import { fetchFromApi } from './fetch';

const apiRoutes = {
  GET_ALL: (organizationId: string) => `/v1/admin/organizations/${organizationId}/models`,
};

export async function fetchLargeLanguageModels(
  organizationId: string,
): Promise<LargeLanguageModel[]> {
  const response = await fetchFromApi(env.BASE_URL_TELLI_API + apiRoutes.GET_ALL(organizationId));

  const data = await response.json();
  return data as LargeLanguageModel[];
}
