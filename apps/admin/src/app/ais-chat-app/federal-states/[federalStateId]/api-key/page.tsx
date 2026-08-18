import { getFederalStateById } from '@shared/federal-states/federal-state-service';
import { FederalStateUpdateApiKey } from './FederalStateUpdateApiKey';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
