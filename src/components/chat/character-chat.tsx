'use client';
import { useChat } from '@ai-sdk/react';
import React from 'react';
import { useTranslations } from 'next-intl';
import { CharacterModel } from '@/db/schema';
import { calculateTimeLeftBySharedChat } from '@/app/(authed)/(dialog)/shared-chats/[sharedSchoolChatId]/utils';
import { SharedChatHeader } from '@/components/chat/header-bar';
import { InitialChatContentDisplay } from '@/components/chat/initial-content-display';
import { ChatBox } from '@/components/chat/chat-box';
import ExpiredChatModal from '@/components/common/expired-chat-modal';
import { ChatInputBox } from '@/components/chat/chat-input-box';
import { ErrorChatPlaceholder } from '@/components/chat/error-message';
import { getAssistantIcon } from './chat';

export default function CharacterSharedChat({
  imageSource,
  ...character
}: CharacterModel & { inviteCode: string; imageSource?: string }) {
  const { id, inviteCode } = character;
  const t = useTranslations('characters.shared');

  const timeLeft = calculateTimeLeftBySharedChat(character);
  const chatActive = timeLeft > 0;

  const searchParams = new URLSearchParams({ id, inviteCode });
  const endpoint = `/api/character?${searchParams.toString()}`;

  const {
    messages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    stop,
    error,
  } = useChat({
    id,
    initialMessages: [],
    api: endpoint,
    experimental_throttle: 100,
    maxSteps: 2,
    body: { modelId: character.modelId },
  });

  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, id, inviteCode]);

  async function customHandleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      handleSubmit(e, {});
    } catch (error) {
      console.error(error);
    }
  }

  function handleOpenNewChat() {
    setMessages([]);
  }
  const assistantIcon = getAssistantIcon({
    imageName: character.name,
    imageSource,
  });

  const innerContent =
    messages.length === 0 ? (
      <InitialChatContentDisplay
        title={character.name}
        description={character.description}
        imageSource={imageSource}
      />
    ) : (
      <div className="flex flex-col gap-4">
        {messages.map((message, index) => {
          return (
            <ChatBox
              key={index}
              index={index}
              isLastUser={index === messages.length - 1 && message.role == 'user'}
              isLastNonUser={index === messages.length - 1 && message.role !== 'user'}
              isLoading={isLoading}
              regenerateMessage={reload}
              assistantIcon={assistantIcon}
            >
              {message}
            </ChatBox>
          );
        })}
      </div>
    );
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
        />

        <div className="flex flex-col flex-1 justify-between items-center w-full overflow-hidden">
          <div
            ref={scrollRef}
            className="flex-grow w-full max-w-5xl overflow-y-auto p-4 pb-[5rem]"
            style={{ maxHeight: 'calc(100vh - 150px)' }}
          >
            {innerContent}
            <ErrorChatPlaceholder error={error} handleReload={reload} />
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
