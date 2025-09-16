import Link from 'next/link';
import { fetchFederalStates } from '../services/federal-states';

export default async function Home() {
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
