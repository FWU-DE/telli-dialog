import { env } from '../consts/env';
import { FederalState } from '../types/federal-state';

const apiRoutes = {
  FEDERAL_STATES_ROUTE: '/api/v1/admin/federal-states',
  FEDERAL_STATE_BY_ID_ROUTE: '/api/v1/admin/federal-states/{id}',
};

export async function fetchFederalStates() {
  const response = await fetch(env.BASE_URL_TELLI_DIALOG + apiRoutes.FEDERAL_STATES_ROUTE, {
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.API_KEY_TELLI_DIALOG}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch federal states: ${response.statusText}`);
  }

  const data = await response.json();
  // validate response with zod
  return data.federalStates as FederalState[];
}

export async function fetchFederalStateById(federalStateId: string) {
  const response = await fetch(
    env.BASE_URL_TELLI_DIALOG + apiRoutes.FEDERAL_STATE_BY_ID_ROUTE.replace('{id}', federalStateId),
    {
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.API_KEY_TELLI_DIALOG}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch federal state by id: ${response.statusText}`);
  }

  const data = await response.json();
  // validate response with zod
  return data as FederalState;
}
