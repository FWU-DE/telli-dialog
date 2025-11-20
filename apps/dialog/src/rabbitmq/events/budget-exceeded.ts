import { UserAndContext } from '@/auth/types';
import { ConversationModel } from '@shared/db/types';
import { CharacterSelectModel, SharedSchoolConversationModel } from '@shared/db/schema';
import { TelliMonthlyTokenBudgetExceededEventType } from '../schema';
import { hashWithoutSalt } from '@/utils/crypto';

type CommonProps = {
  user: UserAndContext;
  anonymous: boolean;
};

type FunctionProps =
  | ({
      conversation: ConversationModel;
    } & CommonProps)
  | ({
      sharedChat: SharedSchoolConversationModel;
    } & CommonProps)
  | ({
      character: CharacterSelectModel;
    } & CommonProps);

export function constructTelliBudgetExceededEvent(
  props: FunctionProps,
): TelliMonthlyTokenBudgetExceededEventType {
  return {
    event_type: 'telli_monthly_token_budget_exceeded' as const,
    pseudonym_id: hashWithoutSalt(props.user.id),
    school_id: props.user.school.id,
    federal_state: props.user.federalState.id,
    timestamp: new Date(),
    user_role: props.user.school.userRole,
  };
}
