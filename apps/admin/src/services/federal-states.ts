import { env } from '../consts/env';
import { routes } from '../consts/routes';
import { FederalState } from '../types/federal-state';

export async function fetchFederalStates() {
  const response = await fetch(env.BASE_URL_TELLI_DIALOG + routes.FEDERAL_STATES_ROUTE, {
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
