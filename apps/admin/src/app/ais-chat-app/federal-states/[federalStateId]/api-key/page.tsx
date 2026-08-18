import { getFederalStateById } from '@shared/federal-states/federal-state-service';
import { FederalStateUpdateApiKey } from './FederalStateUpdateApiKey';

export default async function Page(
  props: PageProps<'/ais-chat-app/federal-states/[federalStateId]/api-key'>,
) {
  const { federalStateId } = await props.params;
  const federalState = await getFederalStateById(federalStateId);

  return (
    <div>
      <FederalStateUpdateApiKey federalState={federalState} />
    </div>
  );
}
