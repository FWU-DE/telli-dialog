import { env } from '../consts/env';
import { Organization } from '../types/organization';
import { fetchFromApi } from './fetch';

const apiRoutes = {
  GET_ALL: '/v1/admin/organizations',
};

export async function fetchOrganizations(): Promise<Organization[]> {
  const response = await fetchFromApi(env.BASE_URL_TELLI_API + apiRoutes.GET_ALL);

  const data = await response.json();

  return data as Organization[];
}
