import { fetchFederalStateById } from '../../../services/federal-states-service';
import { FederalStateView } from './FederalStateDetailView';

export const FEDERAL_STATE_BY_ID_ROUTE = '/federal-states/{id}';

export default async function FederalStatePage({
  params,
}: {
  params: Promise<{ federalStateId: string }>;
}) {
  const federalStateId = (await params).federalStateId;
  const federalState = await fetchFederalStateById(federalStateId);

  return (
    <div>
      <FederalStateView federalState={federalState} />
    </div>
  );
}
