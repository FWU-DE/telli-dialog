'use client';

import { FormEvent, RefObject, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LearningScenarioSelectModel } from '@shared/db/schema';
import { ChatInputBox } from '@/components/chat/chat-input-box';
import { ErrorChatPlaceholder } from '@/components/chat/error-chat-placeholder';
import { InitialChatContentDisplay } from '@/components/chat/initial-content-display';
import { Messages } from '@/components/chat/messages';
import { FloatingText } from '@/components/chat/floating-text';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { useLearningScenarioPreviewChat } from '@/hooks/use-chat-hooks';
import { useCheckStatusCode } from '@/hooks/use-response-status';
import { logError } from '@shared/logging';

export default function LearningScenarioPreviewChat({
  previewSessionId,
  learningScenario,
  maybeSignedPictureUrl,
}: {
  previewSessionId: string;
  learningScenario: LearningScenarioSelectModel;
  maybeSignedPictureUrl?: string;
}) {
  const t = useTranslations('learning-scenarios.shared');

  const [dialogStarted, setDialogStarted] = useState(false);
  const { error, handleError, resetError } = useCheckStatusCode();

  const { messages, uiMessages, input, handleInputChange, handleSubmit, reload, stop, status } =
    useLearningScenarioPreviewChat({
      previewSessionId,
      learningScenarioId: learningScenario.id,
      initialMessages: [],
      modelId: learningScenario.modelId,
      onError: handleError,
    });

  const { scrollRef, reactivateAutoScrolling } = useAutoScroll([messages, previewSessionId]);
  const containerRef = useRef<HTMLDivElement>(null);

  async function customHandleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      reactivateAutoScrolling();
      resetError();
      await handleSubmit(e, {});
    } catch (error) {
      logError('Error in customHandleSubmit (preview)', error);
    }
  }

  function handleReload() {
    resetError();
    reload();
  }

  const isLoading = status === 'submitted';

  return (
    <div className="flex h-dvh min-h-0 w-full flex-col overflow-hidden">
      <div ref={containerRef} className="relative flex min-h-0 flex-1 flex-col items-center w-full">
        <div ref={scrollRef} className="min-h-0 w-full flex-1 max-w-5xl overflow-y-auto p-4 pb-20">
          {learningScenario.studentExercise !== undefined &&
            learningScenario.studentExercise.trim() !== '' && (
              <FloatingText
                learningContext={learningScenario.studentExercise ?? ''}
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
              title={learningScenario.name}
              description={learningScenario.description ?? undefined}
              excerciseDescription={learningScenario.studentExercise ?? undefined}
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
        <div className="w-full max-w-5xl shrink-0 mx-auto px-4 pb-4">
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
  );
}
