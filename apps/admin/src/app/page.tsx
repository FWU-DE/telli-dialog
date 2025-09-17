import Link from 'next/link';
import { fetchFederalStates } from '../services/federal-states-service';
import { FEDERAL_STATE_BY_ID_ROUTE } from './federal-states/[federal-state-id]/page';

export default async function Home() {
  const federalStates = await fetchFederalStates();

  return (
    <div>
      <div className="pb-4">Welches Bundesland möchten Sie konfigurieren?</div>
      <div className="flex flex-wrap gap-4 ">
        {federalStates.map((state) => (
          <Link
            key={state.id}
            href={FEDERAL_STATE_BY_ID_ROUTE.replace('{id}', state.id)}
            className="border rounded p-4"
          >
            {state.id}
          </Link>
        ))}
      </div>
    </div>
  );
}
