'use client';

import { useSharedChat } from '@/hooks/use-chat-hooks';
import { FormEvent, RefObject, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LearningScenarioWithShareDataModel } from '@shared/db/schema';
import ExpiredChatModal from '@/components/common/expired-chat-modal';
import { SharedChatHeader } from '@/components/chat/shared-header-bar';
import { InitialChatContentDisplay } from '@/components/chat/initial-content-display';
import { ChatInputBox } from '@/components/chat/chat-input-box';
import { ErrorChatPlaceholder } from '@/components/chat/error-chat-placeholder';
import { FloatingText } from './floating-text';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { Messages } from './messages';
import { calculateTimeLeftForLearningScenario } from '@shared/learning-scenarios/learning-scenario-service.client';
import { useCheckStatusCode } from '@/hooks/use-response-status';
import { logError } from '@shared/logging';

export default function SharedChat({
  maybeSignedPictureUrl,
  ...sharedSchoolChat
}: LearningScenarioWithShareDataModel & { inviteCode: string; maybeSignedPictureUrl?: string }) {
  const t = useTranslations('shared-chats.shared');

  const { id, inviteCode, modelId } = sharedSchoolChat;
  const timeLeft = calculateTimeLeftForLearningScenario(sharedSchoolChat);
  const chatActive = timeLeft > 0;

  const [dialogStarted, setDialogStarted] = useState(false);
  const { error, handleError, resetError } = useCheckStatusCode();

  const {
    messages,
    uiMessages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
    reload,
    stop,
    status,
  } = useSharedChat({
    sharedChatId: id,
    inviteCode,
    initialMessages: [],
    modelId: modelId ?? undefined,
    onError: handleError,
  });

  const { scrollRef, reactivateAutoScrolling } = useAutoScroll([messages, id, inviteCode]);
  const containerRef = useRef<HTMLDivElement>(null);

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
    reload();
  }

  const isLoading = status === 'submitted';

  return (
    <>
      {!chatActive && (
        <ExpiredChatModal conversationMessages={uiMessages} title={sharedSchoolChat.name} />
      )}
      <div className="flex flex-col h-full w-full">
        <SharedChatHeader
          chatActive={chatActive}
          hasMessages={messages.length > 0}
          t={t}
          handleOpenNewChat={handleOpenNewChat}
          title={sharedSchoolChat.name}
          messages={uiMessages}
          dialogStarted={dialogStarted}
          imageSource={maybeSignedPictureUrl}
        />
        <hr className="w-full border-gray-200 mb-2" />
        <div
          ref={containerRef}
          className="flex flex-col flex-1 justify-between items-center w-full overflow-hidden relative"
        >
          <div
            ref={scrollRef}
            className="flex-grow w-full max-w-5xl overflow-y-auto p-4 pb-[5rem]"
            style={{ maxHeight: 'calc(100vh - 150px)' }}
          >
            {sharedSchoolChat.studentExercise !== undefined &&
              sharedSchoolChat.studentExercise.trim() !== '' && (
                <FloatingText
                  learningContext={sharedSchoolChat.studentExercise ?? ''}
                  dialogStarted={dialogStarted}
                  title={t('excersise-title')}
                  parentRef={containerRef as RefObject<HTMLDivElement>}
                  maxWidth={600}
                  maxHeight={600}
                  minMargin={16}
                />
              )}
            {messages.length === 0 && !dialogStarted ? (
              <InitialChatContentDisplay
                title={sharedSchoolChat.name}
                description={sharedSchoolChat.description}
                excerciseDescription={sharedSchoolChat.studentExercise}
                imageSource={maybeSignedPictureUrl}
                setDialogStarted={setDialogStarted}
              />
            ) : (
              <Messages
                messages={uiMessages}
                isLoading={isLoading}
                status={status}
                reload={reload}
                containerClassName="flex flex-col gap-4"
              />
            )}
            {error && <ErrorChatPlaceholder error={error} handleReload={handleReload} />}
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
