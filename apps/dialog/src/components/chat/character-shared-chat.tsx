'use client';

import { useChat } from '@ai-sdk/react';
import { FormEvent, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CharacterWithShareDataModel } from '@shared/db/schema';
import { SharedChatHeader } from '@/components/chat/shared-header-bar';
import { InitialChatContentDisplay } from '@/components/chat/initial-content-display';
import ExpiredChatModal from '@/components/common/expired-chat-modal';
import { ChatInputBox } from '@/components/chat/chat-input-box';
import { ErrorChatPlaceholder } from '@/components/chat/error-chat-placeholder';
import useBreakpoints from '../hooks/use-breakpoints';
import { useCheckStatusCode } from '@/hooks/use-response-status';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { Message } from 'ai';
import { AssistantIcon } from './assistant-icon';
import { messageContainsAttachments } from '@/utils/chat/messages';
import { Messages } from './messages';
import { calculateTimeLeftForLearningScenario } from '@shared/learning-scenarios/learning-scenario-service.client';
import { reductionBreakpoint } from '@/utils/tailwind/layout';

/**
 * This component is used if a character is shared via invite code.
 */
export default function CharacterSharedChat({
  imageSource,
  ...character
}: CharacterWithShareDataModel & { inviteCode: string; imageSource?: string }) {
  const t = useTranslations('characters.shared');

  const { id, inviteCode } = character;
  const timeLeft = calculateTimeLeftForLearningScenario(character);
  const chatActive = timeLeft > 0;

  const searchParams = new URLSearchParams({ id, inviteCode });
  const endpoint = `/api/character?${searchParams.toString()}`;

  const [lastMessageHasAttachments, setLastMessageHasAttachments] = useState(false);

  // substitute the error object from the useChat hook, to dislay a user friendly error message in German
  const { error, handleResponse, handleError, resetError } = useCheckStatusCode();
  const initialMessages: Message[] = character.initialMessage
    ? [{ id: 'initial-message', role: 'assistant', content: character.initialMessage }]
    : [];

  const { messages, setMessages, input, handleInputChange, handleSubmit, reload, status, stop } =
    useChat({
      id,
      initialMessages,
      api: endpoint,
      experimental_throttle: 100,
      maxSteps: 2,
      onResponse: handleResponse,
      onError: handleError,
    });

  const scrollRef = useAutoScroll([messages, id, inviteCode]);
  const { isBelow } = useBreakpoints();

  async function customHandleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setLastMessageHasAttachments(messageContainsAttachments(input));
      handleSubmit(e, {});
    } catch (error) {
      console.error(error);
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
      {!chatActive && <ExpiredChatModal conversationMessages={messages} title={character.name} />}
      <div className="flex flex-col h-full w-full overflow-hidden">
        <SharedChatHeader
          chatActive={chatActive}
          hasMessages={messages.length > 0}
          t={t}
          handleOpenNewChat={handleOpenNewChat}
          title={character.name}
          messages={messages}
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
                messages={messages}
                isLoading={isLoading}
                status={status}
                reload={reload}
                assistantIcon={assistantIcon}
                doesLastUserMessageContainLinkOrFile={lastMessageHasAttachments}
                containerClassName="flex flex-col gap-4"
              />
            )}
            <ErrorChatPlaceholder error={error} handleReload={handleReload} />
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
    </>
  );
}
