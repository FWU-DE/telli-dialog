'use client';

import { useChat } from '@ai-sdk/react';
import React from 'react';
import { useTranslations } from 'next-intl';
import {
  constructLocalStorageKey,
  getMaybeLocaleStorageChats,
  saveToLocalStorage,
} from '@/components/providers/local-storage';
import { type SharedSchoolConversationModel } from '@/db/schema';
import { generateUUID } from '@/utils/uuid';
import { calculateTimeLeftBySharedChat } from '@/app/(authed)/(dialog)/shared-chats/[sharedSchoolChatId]/utils';
import ExpiredChatModal from '@/components/common/expired-chat-modal';
import { SharedChatHeader } from '@/components/chat/header-bar';
import { InitialChatContentDisplay } from '@/components/chat/initial-content-display';
import { ChatBox } from '@/components/chat/chat-box';
import { ChatInputBox } from '@/components/chat/chat-input-box';
import { ErrorChatPlaceholder } from '@/components/chat/error-message';
import { FloatingText } from './floating-text';

export default function SharedChat({
  maybeSignedPictureUrl,
  ...sharedSchoolChat
}: SharedSchoolConversationModel & { inviteCode: string; maybeSignedPictureUrl?: string }) {
  const t = useTranslations('shared-chats.shared');

  const { id, inviteCode } = sharedSchoolChat;
  const timeLeft = calculateTimeLeftBySharedChat(sharedSchoolChat);
  const chatActive = timeLeft > 0;

  const searchParams = new URLSearchParams({ id, inviteCode });
  const endpoint = `/api/shared-chat?${searchParams.toString()}`;

  const localStorageChats = (getMaybeLocaleStorageChats({ id, inviteCode }) ?? []).map(
    (message) => ({
      ...message,
      id: generateUUID(),
    }),
  );
  const [dialogStarted, setDialogStarted] = React.useState(localStorageChats.length > 0);

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
    initialMessages: localStorageChats,
    api: endpoint,
    experimental_throttle: 100,
    maxSteps: 2,
    body: { modelId: sharedSchoolChat.modelId },
  });

  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    saveToLocalStorage(constructLocalStorageKey({ id, inviteCode }), JSON.stringify(messages));
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
    saveToLocalStorage(constructLocalStorageKey({ id, inviteCode }), '');
    setMessages([]);
  }

  return (
    <>
      {!chatActive && (
        <ExpiredChatModal conversationMessages={messages} title={sharedSchoolChat.name} />
      )}
      <div className="flex flex-col h-full w-full overflow-hidden">
        <SharedChatHeader
          chatActive={chatActive}
          hasMessages={dialogStarted}
          t={t}
          handleOpenNewChat={handleOpenNewChat}
          title={sharedSchoolChat.name}
          messages={messages}
        />
        <div
          ref={containerRef}
          className="flex flex-col flex-1 justify-between items-center w-full overflow-hidden"
        >
          <div
            ref={scrollRef}
            className="flex-grow w-full max-w-[50rem] overflow-y-hidden p-4 pb-[5rem]"
            style={{ maxHeight: 'calc(100vh - 150px)' }}
          >
            {messages.length === 0 && !dialogStarted ? (
              <InitialChatContentDisplay
                title={sharedSchoolChat.name}
                description={sharedSchoolChat.description}
                excersiseDescription={sharedSchoolChat.learningContext}
                imageSource={maybeSignedPictureUrl}
                setDialogStarted={setDialogStarted}
              />
            ) : (
              <>
                <FloatingText
                  learningContext={sharedSchoolChat.learningContext ?? ''}
                  dialogStarted={dialogStarted}
                  title={'Arbeitsauftrag'}
                  parentRef={containerRef as React.RefObject<HTMLDivElement>}
                />
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
                      >
                        {message}
                      </ChatBox>
                    );
                  })}
                </div>
              </>
            )}
            <ErrorChatPlaceholder error={error} handleReload={reload} />
          </div>
          <div className="w-full max-w-3xl mx-auto px-4 pb-4">
            {dialogStarted && (
              <div className="flex flex-col">
                <ChatInputBox
                  customHandleSubmit={customHandleSubmit}
                  handleStopGeneration={stop}
                  input={input}
                  isLoading={isLoading}
                  handleInputChange={handleInputChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
