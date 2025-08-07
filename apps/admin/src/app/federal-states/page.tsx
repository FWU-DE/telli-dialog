import { env } from '../../consts/env';
import { FederalState, FederalStateView } from './FederalStateView';

const FEDERAL_STATES_ROUTE = '/api/v1/admin/federal-states';

export default async function FederalStatesPage() {
  async function fetchFederalStates() {
    const response = await fetch(env.BASE_URL_TELLI_DIALOG + FEDERAL_STATES_ROUTE, {
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

  const federalStates = await fetchFederalStates();

  return (
    <div>
      {federalStates.map((federalState) => {
        return <FederalStateView key={federalState.id} federalState={federalState} />;
      })}
    </div>
  );
}
