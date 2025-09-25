const apiRoutes = {
  GET_ALL: '/v1/admin/organizations',
};

import { env } from '../consts/env';
import { Organization } from '../types/organization';

export async function fetchOrganizations(): Promise<Organization[]> {
  const response = await fetch(env.BASE_URL_TELLI_API + apiRoutes.GET_ALL, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.API_KEY_TELLI_API}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch organizations: ${response.statusText}`);
  }

  const data = await response.json();

  // TODO: fix endpoint to return array directly
  return data.organizations as Organization[];
}

export async function fetchSingleOrganization(): Promise<Organization> {
  const organizations = await fetchOrganizations();
  if (organizations.length === 0) {
    throw new Error('No organizations found');
  } else if (organizations.length > 1) {
    throw new Error('More than one organization found. This is not supported yet.');
  }

  console.log('Fetched organization:', organizations[0]);
  return organizations[0]!;
}
