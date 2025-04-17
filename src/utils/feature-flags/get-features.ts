import { FederalStateId } from '../vidis/const';
import { FEDERAL_STATE_DISABLE_FEATURE_FLAGS } from './const';

export function getDisabledFederalFeatures({ id }: { id: FederalStateId }) {
  return (
    FEDERAL_STATE_DISABLE_FEATURE_FLAGS[id] ?? {
      disable_shared_chats: false,
      disable_characters: false,
      disable_customGpt: false,
    }
  );
}
