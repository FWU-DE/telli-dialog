import { env } from '../consts/env';
import {
  LargeLanguageModel,
  CreateLargeLanguageModel,
  UpdateLargeLanguageModel,
} from '../types/large-language-model';
import { fetchFromApi } from './fetch';

const apiRoutes = {
  GET_ALL: (organizationId: string) => `/v1/admin/organizations/${organizationId}/models`,
  POST_NEW: (organizationId: string) => `/v1/admin/organizations/${organizationId}/models`,
  PATCH_ONE: (organizationId: string, modelId: string) =>
    `/v1/admin/organizations/${organizationId}/models/${modelId}`,
};

export async function fetchLargeLanguageModels(
  organizationId: string,
): Promise<LargeLanguageModel[]> {
  const response = await fetchFromApi(env.telliApiBaseUrl + apiRoutes.GET_ALL(organizationId));

  const data = await response.json();
  return data as LargeLanguageModel[];
}

export async function createLargeLanguageModel(
  organizationId: string,
  data: CreateLargeLanguageModel,
): Promise<LargeLanguageModel> {
  const response = await fetchFromApi(env.telliApiBaseUrl + apiRoutes.POST_NEW(organizationId), {
    method: 'POST',
    body: JSON.stringify({ ...data, organizationId }),
  });

  const result = await response.json();
  return result as LargeLanguageModel;
}

export async function updateLargeLanguageModel(
  organizationId: string,
  modelId: string,
  data: UpdateLargeLanguageModel,
): Promise<LargeLanguageModel> {
  const response = await fetchFromApi(
    env.telliApiBaseUrl + apiRoutes.PATCH_ONE(organizationId, modelId),
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  );

  const result = await response.json();
  return result as LargeLanguageModel;
}
