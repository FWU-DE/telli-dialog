import { fetchFederalStateById } from '../../../services/federal-states-service';
import { FederalStateView } from './FederalStateView';

export const FEDERAL_STATE_BY_ID_ROUTE = '/federal-states/{id}';

export default async function FederalStatePage({
  params,
}: {
  params: Promise<{ 'federal-state-id': string }>;
}) {
  const federalStateId = (await params)['federal-state-id'];
  const federalState = await fetchFederalStateById(federalStateId);
  console.log('FederalState', federalState);

  return (
    <div>
      <FederalStateView federalState={federalState} />
    </div>
  );
}
