import Link from 'next/link';
import { fetchFederalStates } from '../../services/federal-states-service';
import { Button } from '@ui/components/button';

export default async function Page() {
  const federalStates = await fetchFederalStates();

  return (
    <div>
      <h1>Guthaben Codes</h1>
      <hr />
      <label>Wähle ein Bundesland:</label>
      <div className="mt-4 flex flex-row flex-wrap gap-2">
        {federalStates.map((state) => (
          <Link key={state.id} href={`/vouchers/${state.id}`}>
            <Button>{state.telliName || state.id}</Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
