import { fetchFederalStateById } from '../../../../../services/federal-states-service';
import { FederalStateUpdateApiKey } from './FederalStateUpdateApiKey';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ federalStateId: string }> }) {
  const federalStateId = (await params).federalStateId;
  const federalState = await fetchFederalStateById(federalStateId);

  return (
    <div>
      <FederalStateUpdateApiKey federalState={federalState} />
    </div>
  );
}
