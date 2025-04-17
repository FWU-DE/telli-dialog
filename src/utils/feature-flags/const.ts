import { FederalStateId } from '../vidis/const';

export type FeatureEnum = {
  disable_shared_chats: boolean;
  disable_characters: boolean;
  disable_customGpt: boolean;
};

export const FEDERAL_STATE_DISABLE_FEATURE_FLAGS: Partial<Record<FederalStateId, FeatureEnum>> = {
  'DE-SL': {
    disable_shared_chats: true,
    disable_characters: true,
    disable_customGpt: false,
  },
};
