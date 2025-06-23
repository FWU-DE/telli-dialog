'use client';

import { useChat } from '@ai-sdk/react';
import React from 'react';
import { useTranslations } from 'next-intl';
import { type SharedSchoolConversationModel } from '@/db/schema';

import { calculateTimeLeftBySharedChat } from '@/app/(authed)/(dialog)/shared-chats/[sharedSchoolChatId]/utils';
import ExpiredChatModal from '@/components/common/expired-chat-modal';
import { SharedChatHeader } from '@/components/chat/shared-header-bar';
import { InitialChatContentDisplay } from '@/components/chat/initial-content-display';
import { ChatBox } from '@/components/chat/chat-box';
import { ChatInputBox } from '@/components/chat/chat-input-box';
import { ErrorChatPlaceholder } from '@/components/chat/error-chat-placeholder';
import { FloatingText } from './floating-text';
import { useDisplayError } from '@/hooks/use-response-status';

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

  const [dialogStarted, setDialogStarted] = React.useState(false);

  const { error: handledError, handleResponse, clearRateLimit } = useDisplayError();

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
    body: { modelId: sharedSchoolChat.modelId },
    onResponse: handleResponse,
  });

  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

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

  function handleReload() {
    // Clear rate limit error before reloading
    clearRateLimit();
    reload();
  }

  const innerContent =
    messages.length === 0 && !dialogStarted ? (
      <InitialChatContentDisplay
        title={sharedSchoolChat.name}
        description={sharedSchoolChat.description}
        excerciseDescription={sharedSchoolChat.studentExcercise}
        imageSource={maybeSignedPictureUrl}
        setDialogStarted={setDialogStarted}
      />
    ) : (
      <>
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
    );
  return (
    <>
      {!chatActive && (
        <ExpiredChatModal conversationMessages={messages} title={sharedSchoolChat.name} />
      )}
      <div className="flex flex-col h-full w-full">
        <SharedChatHeader
          chatActive={chatActive}
          hasMessages={messages.length > 0}
          t={t}
          handleOpenNewChat={handleOpenNewChat}
          title={sharedSchoolChat.name}
          messages={messages}
          dialogStarted={dialogStarted}
          imageSource={maybeSignedPictureUrl}
        />
        <hr className="w-full border-gray-200 mb-2" />
        <div
          ref={containerRef}
          className="flex flex-col flex-1 justify-between items-center w-full overflow-hidden"
        >
          <div
            ref={scrollRef}
            className="flex-grow w-full max-w-5xl overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 150px)' }}
          >
            {sharedSchoolChat.studentExcercise !== undefined &&
              sharedSchoolChat.studentExcercise.trim() !== '' && (
                <FloatingText
                  learningContext={sharedSchoolChat.studentExcercise ?? ''}
                  dialogStarted={dialogStarted}
                  title={t('excersise-title')}
                  parentRef={containerRef as React.RefObject<HTMLDivElement>}
                  maxWidth={600}
                  maxHeight={600}
                  initialMargin={32}
                  minMargin={16}
                />
              )}
            {innerContent}
            <ErrorChatPlaceholder
              unhandledError={error}
              handledError={handledError}
              handleReload={handleReload}
            />
          </div>
          <div className="w-full max-w-5xl mx-auto px-4 pb-4">
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
