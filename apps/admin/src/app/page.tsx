import Link from 'next/link';
import { env } from '../consts/env';
import { routes } from '../consts/routes';
import { FederalState } from '../types/federal-state';
import Loading from './loading';

export default async function Home() {
  async function fetchFederalStates() {
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
  const federalStates = await fetchFederalStates();

  return (
    <div>
      <div className="pb-4">Welches Bundesland möchten Sie konfigurieren?</div>
      <div className="flex flex-wrap gap-4 ">
        {federalStates.map((state) => (
          <Link key={state.id} href={'/federal-state/' + state.id} className="border rounded p-4">
            {state.id}
          </Link>
        ))}
      </div>
    </div>
  );
}
