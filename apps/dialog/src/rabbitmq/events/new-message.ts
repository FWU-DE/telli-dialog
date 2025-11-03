import { UserAndContext } from '@/auth/types';
import { ConversationModel } from '@shared/db/types';
import { CharacterModel, SharedSchoolConversationModel } from '@shared/db/schema';
import { TelliNewChatMessageEventType } from '../schema';
import { hashWithoutSalt } from '@/utils/crypto';

type CommonProps = {
  user: UserAndContext;
  anonymous: boolean;
  promptTokens: number;
  completionTokens: number;
  costsInCent: number;
  provider: string;
};

type FunctionProps =
  | ({
      conversation: ConversationModel;
    } & CommonProps)
  | ({
      sharedChat: SharedSchoolConversationModel;
    } & CommonProps)
  | ({
      character: CharacterModel;
    } & CommonProps);

export function constructTelliNewMessageEvent(props: FunctionProps): TelliNewChatMessageEventType {
  const commonObjectProps = {
    event_type: 'telli_new_chat_message' as const,
    school_id: props.user.school.id,
    federal_state: props.user.federalState.id,
    provider: props.provider,
    cost_in_cent: props.costsInCent,
    timestamp: new Date(),
    user_role: props.anonymous ? 'anonymous' : props.user.school.userRole,
    input_tokens: props.promptTokens,
    output_tokens: props.completionTokens,
  };

  if ('conversation' in props) {
    return {
      chat_id: props.conversation.id,
      chat_type: props.conversation.characterId !== null ? 'character' : 'standard',
      pseudonym_id: hashWithoutSalt(props.anonymous ? props.conversation.id : props.user.id),
      ...commonObjectProps,
    };
  } else if ('sharedChat' in props) {
    return {
      chat_id: props.sharedChat.id,
      chat_type: 'classdialog',
      pseudonym_id: hashWithoutSalt(props.anonymous ? props.sharedChat.id : props.user.id),
      ...commonObjectProps,
    };
  } else {
    return {
      chat_id: props.character.id,
      chat_type: 'character',
      pseudonym_id: hashWithoutSalt(props.anonymous ? props.character.id : props.user.id),
      ...commonObjectProps,
    };
  }
}
