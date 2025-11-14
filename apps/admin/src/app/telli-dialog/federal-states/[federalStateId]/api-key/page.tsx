import { getFederalStateById } from '@shared/services/federal-state-service';
import { FederalStateUpdateApiKey } from './FederalStateUpdateApiKey';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ federalStateId: string }> }) {
  const federalStateId = (await params).federalStateId;
  const federalState = await getFederalStateById(federalStateId);

  return (
    <div>
      <FederalStateUpdateApiKey federalState={federalState} />
    </div>
  );
}
