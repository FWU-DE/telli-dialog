'use client';

import { useCharacterChat, type ChatMessage } from '@/hooks/use-chat-hooks';
import { useTranslations } from 'next-intl';
import { CharacterWithShareDataModel } from '@shared/db/schema';
import useBreakpoints from '../hooks/use-breakpoints';
import { AssistantIcon } from '../chat/assistant-icon';
import GenericSharedChat from './generic-shared-chat';
import { reductionBreakpoint } from '@/utils/tailwind/layout';
import { useCheckStatusCode } from '@/hooks/use-response-status';

/**
 * This component is used if a character is shared via invite code.
 */
export default function CharacterSharedChat({
  avatarPictureUrl,
  ...character
}: CharacterWithShareDataModel & { inviteCode: string; avatarPictureUrl?: string }) {
  const t = useTranslations('characters.shared');
  const { id, inviteCode, modelId } = character;

  const initialMessages: ChatMessage[] = character.initialMessage
    ? [{ id: 'initial-message', role: 'assistant', content: character.initialMessage }]
    : [];

  const errorState = useCheckStatusCode();
  const chat = useCharacterChat({
    characterId: id,
    inviteCode,
    initialMessages,
    modelId: modelId ?? undefined,
    onError: errorState.handleError,
  });

  const { isBelow } = useBreakpoints();
  const assistantIcon = AssistantIcon({
    imageName: character.name,
    imageSource: avatarPictureUrl,
    className: isBelow[reductionBreakpoint] ? 'mt-0 mx-0' : undefined,
  });

  return (
    <GenericSharedChat
      headerT={t}
      entity={character}
      inviteCode={inviteCode}
      avatarPictureUrl={avatarPictureUrl}
      chat={chat}
      errorState={errorState}
      dialogStartMode="derived"
      assistantIcon={assistantIcon}
    />
  );
}
