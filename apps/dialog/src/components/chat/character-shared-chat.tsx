'use client';

import { useCharacterChat, type ChatMessage } from '@/hooks/use-chat-hooks';
import { FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { CharacterWithShareDataModel } from '@shared/db/schema';
import { SharedChatHeader } from '@/components/chat/shared-header-bar';
import { InitialChatContentDisplay } from '@/components/chat/initial-content-display';
import ExpiredChatModal from '@/components/common/expired-chat-modal';
import { ChatInputBox } from '@/components/chat/chat-input-box';
import { ErrorChatPlaceholder } from '@/components/chat/error-chat-placeholder';
import useBreakpoints from '../hooks/use-breakpoints';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { AssistantIcon } from './assistant-icon';
import { Messages } from './messages';
import { calculateTimeLeft } from '@shared/sharing/calculate-time-left';
import StreamingFinishedMarker from './streaming-finished-marker';
import { reductionBreakpoint } from '@/utils/tailwind/layout';
import { useCheckStatusCode } from '@/hooks/use-response-status';
import { logError } from '@shared/logging';

/**
 * This component is used if a character is shared via invite code.
 */
export default function CharacterSharedChat({
  imageSource,
  ...character
}: CharacterWithShareDataModel & { inviteCode: string; imageSource?: string }) {
  const t = useTranslations('characters.shared');

  const { id, inviteCode, modelId } = character;
  const timeLeft = calculateTimeLeft(character);
  const chatActive = timeLeft > 0;

  const { error, handleError, resetError } = useCheckStatusCode();

  const initialMessages: ChatMessage[] = character.initialMessage
    ? [{ id: 'initial-message', role: 'assistant', content: character.initialMessage }]
    : [];

  const {
    messages,
    uiMessages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
    reload,
    status,
    stop,
  } = useCharacterChat({
    characterId: id,
    inviteCode,
    initialMessages,
    modelId: modelId ?? undefined,
    onError: handleError,
  });

  const { scrollRef, reactivateAutoScrolling } = useAutoScroll([messages, id, inviteCode]);
  const { isBelow } = useBreakpoints();

  async function customHandleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      reactivateAutoScrolling();
      resetError();
      await handleSubmit(e, {});
    } catch (error) {
      logError('Error in customHandleSubmit', error);
    }
  }

  function handleOpenNewChat() {
    setMessages([]);
    resetError();
  }

  function handleReload() {
    resetError();
    void reload();
  }

  const assistantIcon = AssistantIcon({
    imageName: character.name,
    imageSource,
    className: isBelow[reductionBreakpoint] ? 'mt-0 mx-0' : undefined,
  });

  const isLoading = status === 'submitted';

  return (
    <>
      {!chatActive && <ExpiredChatModal conversationMessages={uiMessages} title={character.name} />}
      <div className="flex flex-col h-full w-full overflow-hidden">
        <SharedChatHeader
          chatActive={chatActive}
          hasMessages={messages.length > 0}
          t={t}
          handleOpenNewChat={handleOpenNewChat}
          title={character.name}
          messages={uiMessages}
          // currently this is redundant, due to the inconsistency with the shared school chat initial page
          dialogStarted={messages.length > 0}
        />
        <hr className="w-full border-gray-200" />
        <div className="flex flex-col flex-1 justify-between items-center w-full overflow-hidden">
          <div
            ref={scrollRef}
            className="flex-grow w-full max-w-5xl overflow-y-auto p-4 pb-[5rem]"
            style={{ maxHeight: 'calc(100vh - 150px)' }}
          >
            {messages.length === 0 ? (
              <InitialChatContentDisplay
                title={character.name}
                description={character.description}
                imageSource={imageSource}
              />
            ) : (
              <Messages
                messages={uiMessages}
                isLoading={isLoading}
                status={status}
                reload={reload}
                assistantIcon={assistantIcon}
                containerClassName="flex flex-col gap-4"
              />
            )}
            {error && <ErrorChatPlaceholder error={error} handleReload={handleReload} />}
          </div>
          <div className="w-full max-w-5xl mx-auto px-4 pb-4">
            <div className="flex flex-col">
              <ChatInputBox
                handleStopGeneration={stop}
                customHandleSubmit={customHandleSubmit}
                input={input}
                isLoading={isLoading}
                handleInputChange={handleInputChange}
              />
            </div>
          </div>
        </div>
      </div>
      <StreamingFinishedMarker status={status} />
    </>
  );
}
