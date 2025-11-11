'use server';
import { env } from '../consts/env';
import { FederalState } from '../types/federal-state';
import { fetchFromDialog } from './fetch';

const apiRoutes = {
  FEDERAL_STATES_ROUTE: '/api/v1/admin/federal-states',
  FEDERAL_STATE_BY_ID_ROUTE: (id: string) => `/api/v1/admin/federal-states/${id}`,
};

export async function fetchFederalStates() {
  const response = await fetchFromDialog(env.telliDialogBaseUrl + apiRoutes.FEDERAL_STATES_ROUTE);

  const data = await response.json();
  return data.federalStates as FederalState[];
}

export async function fetchFederalStateById(federalStateId: string) {
  const response = await fetchFromDialog(
    env.telliDialogBaseUrl + apiRoutes.FEDERAL_STATE_BY_ID_ROUTE(federalStateId),
  );

  const data = await response.json();
  // validate response with zod
  return data as FederalState;
}

export async function updateFederalState(federalState: FederalState) {
  const response = await fetchFromDialog(
    env.telliDialogBaseUrl + apiRoutes.FEDERAL_STATE_BY_ID_ROUTE(federalState.id),
    {
      method: 'PUT',
      body: JSON.stringify(federalState),
    },
  );

  const data = await response.json();
  return data as FederalState;
}

export async function patchApiKey(federalStateId: string, decryptedApiKey: string) {
  const response = await fetchFromDialog(
    env.telliDialogBaseUrl + apiRoutes.FEDERAL_STATE_BY_ID_ROUTE(federalStateId),
    {
      method: 'PATCH',
      body: JSON.stringify({ decryptedApiKey }),
    },
  );

  const data = await response.json();
  // unsure what the return value is atm.
  return data;
}
