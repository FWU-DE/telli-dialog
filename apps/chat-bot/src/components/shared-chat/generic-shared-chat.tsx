'use client';

import { ReactNode, RefObject, SyntheticEvent, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import ExpiredChatModal from '@/components/common/expired-chat-modal';
import { SharedChatHeader } from '@/components/chat/shared-header-bar';
import { InitialChatContentDisplay } from '@/components/chat/initial-content-display';
import { ChatInputBox } from '@/components/chat/chat-input-box';
import { ErrorChatPlaceholder } from '@/components/chat/error-chat-placeholder';
import { FloatingText } from '../chat/floating-text';
import { Messages } from '../chat/messages';
import StreamingFinishedMarker from '../chat/streaming-finished-marker';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { useCheckStatusCode } from '@/hooks/use-response-status';
import { calculateTimeLeft } from '@shared/sharing/calculate-time-left';
import { logError } from '@shared/logging';
import type { UseChatReturn } from '@/hooks/use-chat-hooks';

type CalculateTimeLeftInput = Parameters<typeof calculateTimeLeft>[0];
type Translator = ReturnType<typeof useTranslations>;

type EntityMeta = CalculateTimeLeftInput & {
  id: string;
  name: string;
  description: string;
};

type ErrorState = ReturnType<typeof useCheckStatusCode>;

export type SharedChatViewProps = {
  /**
   * Translation function used by the chat header. Pre-resolved by the caller so
   * the view stays agnostic of the translation namespace.
   */
  headerT: Translator;
  /**
   * Entity used to derive title/description, expiry and header information.
   * Can be used with learning scenarios and characters.
   */
  entity: EntityMeta;
  inviteCode: string;
  avatarPictureUrl?: string;
  /**
   * Chat hook result owned by the caller. The caller is responsible for wiring
   * `errorState.handleError` into the chat hook's `onError` option.
   */
  chat: UseChatReturn;
  /**
   * Error/expiry state from `useCheckStatusCode`, owned by the caller so that
   * `handleError` can be passed to the chat hook.
   */
  errorState: ErrorState;
  /**
   * Controls how the "dialog has started" state is derived:
   * - `explicit`: managed via local `useState`, toggled from the initial content
   *   display. The chat input is only rendered after the user starts the dialog.
   * - `derived`: treated as started as soon as there is at least one message.
   *   The chat input is always rendered.
   */
  dialogStartMode: 'explicit' | 'derived';
  /**
   * When provided alongside `enableFloatingText`, renders the floating exercise
   * description and forwards the description to the initial content display.
   */
  exerciseDescription?: string;
  /**
   * Title shown above the floating exercise description. Required when
   * `enableFloatingText` is true and `exerciseDescription` is non-empty.
   */
  exerciseTitle?: string;
  /**
   * Enables the layout containers and floating text needed for the exercise
   * overlay. Layout differs slightly from the plain layout (relative container,
   * `w-full` outer/inner, extra hr spacing).
   */
  enableFloatingText?: boolean;
  /**
   * Icon rendered next to assistant messages. When provided, also rendered by the
   * `Messages` list.
   */
  assistantIcon?: ReactNode;
};

/**
 * Shared chat shell used by the invite-based shared chats (learning scenarios and
 * characters). Owns the common layout, auto-scrolling, expired chat modal,
 * header, message list and input box. Entity-specific behaviour (which chat hook
 * to call, initial assistant message, floating exercise text, streaming marker,
 * assistant icon) is configured via props.
 */
export default function GenericSharedChat({
  headerT,
  entity,
  inviteCode,
  avatarPictureUrl,
  chat,
  errorState,
  dialogStartMode,
  exerciseDescription,
  exerciseTitle,
  enableFloatingText = false,
  assistantIcon,
}: SharedChatViewProps) {
  const timeLeft = calculateTimeLeft(entity);
  const chatActive = timeLeft > 0;

  const [explicitDialogStarted, setExplicitDialogStarted] = useState(false);

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
    clearClientPersistedMessages,
  } = chat;
  const { error, isChatExpired, resetError } = errorState;

  const { scrollRef, reactivateAutoScrolling } = useAutoScroll([messages, entity.id, inviteCode]);
  const containerRef = useRef<HTMLDivElement>(null);

  const dialogStarted =
    dialogStartMode === 'explicit' ? explicitDialogStarted : messages.length > 0;

  async function customHandleSubmit(e: SyntheticEvent) {
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
    clearClientPersistedMessages();
    setMessages([]);
    resetError();
  }

  function handleReload() {
    resetError();
    void reload();
  }

  const isLoading = status === 'submitted';
  const hasExerciseDescription =
    enableFloatingText && exerciseDescription !== undefined && exerciseDescription.trim() !== '';
  const showInitialContent =
    dialogStartMode === 'explicit'
      ? messages.length === 0 && !dialogStarted
      : messages.length === 0;
  const showChatInputBox = dialogStartMode === 'explicit' ? dialogStarted : true;

  return (
    <>
      {(!chatActive || isChatExpired) && (
        <ExpiredChatModal
          conversationMessages={uiMessages}
          title={entity.name}
          inviteCode={inviteCode}
        />
      )}
      <div className="flex h-dvh min-h-0 flex-col overflow-hidden">
        <SharedChatHeader
          chatActive={chatActive}
          hasMessages={messages.length > 0}
          t={headerT}
          handleOpenNewChat={handleOpenNewChat}
          title={entity.name}
          messages={uiMessages}
          dialogStarted={dialogStarted}
          imageSource={avatarPictureUrl}
          inviteCode={inviteCode}
        />
        <div ref={containerRef} className="relative flex min-h-0 flex-1 flex-col items-center">
          <div
            ref={scrollRef}
            className="min-h-0 w-full flex-1 max-w-5xl overflow-y-auto p-4 pb-20"
          >
            {hasExerciseDescription && (
              <FloatingText
                learningContext={exerciseDescription ?? ''}
                dialogStarted={dialogStarted}
                title={exerciseTitle ?? ''}
                parentRef={containerRef as RefObject<HTMLDivElement>}
                maxWidth={600}
                maxHeight={600}
                minMargin={16}
              />
            )}
            {showInitialContent ? (
              <InitialChatContentDisplay
                title={entity.name}
                description={entity.description}
                excerciseDescription={enableFloatingText ? exerciseDescription : undefined}
                imageSource={avatarPictureUrl}
                setDialogStarted={
                  dialogStartMode === 'explicit' ? setExplicitDialogStarted : undefined
                }
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
          <div className="w-full max-w-5xl shrink-0 mx-auto px-4 pb-4">
            {showChatInputBox && (
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
      <StreamingFinishedMarker status={status} />
    </>
  );
}
