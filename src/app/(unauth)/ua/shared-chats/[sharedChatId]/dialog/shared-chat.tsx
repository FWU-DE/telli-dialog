'use client';

import AutoResizeTextarea from '@/components/common/auto-resize-textarea';
import { cn } from '@/utils/tailwind';
import { useChat } from '@ai-sdk/react';
import ArrowRightIcon from '@/components/icons/arrow-right';
import ReloadIcon from '@/components/icons/reload';
import StopIcon from '@/components/icons/stop';
import React from 'react';
import { useTranslations } from 'next-intl';
import { readFromLocalStorage, saveToLocalStorage } from '@/components/providers/local-storage';
import { z } from 'zod';
import { type SharedSchoolConversationModel } from '@/db/schema';
import { messageRoleSchema } from '@/components/chat/schemas';
import { generateUUID } from '@/utils/uuid';
import { calculateTimeLeftBySharedChat } from '@/app/(authed)/(dialog)/shared-chats/[sharedSchoolChatId]/utils';
import MarkdownDisplay from '@/components/chat/markdown-display';
import { UnauthenticatedProfileMenu } from '@/components/navigation/profile-menu';
import DownloadSharedConversationButton from '../../../dowload-shared-conversation-button';
import TelliClipboardButton from '@/components/common/clipboard-button';
import TrashFilledIcon from '@/components/icons/trash-filled';
import DestructiveActionButton from '@/components/common/destructive-action-button';
import ExpiredChatModal from '@/components/common/expired-chat-modal';

export default function SharedChat({
  ...sharedSchoolChat
}: SharedSchoolConversationModel & { inviteCode: string }) {
  const t = useTranslations('shared-chats.shared');
  const tCommon = useTranslations('common');

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

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  async function customHandleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      handleSubmit(e, {});
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSubmitOnEnter(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !isLoading && !e.shiftKey) {
      e.preventDefault();
      if (e.currentTarget.value.trim().length > 0) {
        await customHandleSubmit(e);
      }
    }
  }

  function handleOpenNewChat() {
    saveToLocalStorage(constructLocalStorageKey({ id, inviteCode }), '');
    setMessages([]);
  }

  return (
    <>
      {!chatActive && <ExpiredChatModal conversationMessages={messages} />}
      <div className="flex flex-col h-full w-full overflow-hidden">
        <header className="flex gap-4 justify-between items-center py-[1.15rem] px-6">
          {chatActive && messages.length > 0 && (
            <>
              <DestructiveActionButton
                modalTitle={t('delete-chat-modal-title')}
                confirmText={t('delete-chat-modal-confirm-button')}
                modalDescription={t('delete-chat-modal-description')}
                triggerButtonClassName="flex justify-center items-center w-8 h-8 group disabled:bg-light-gray disabled:text-gray-100 group !px-0 !py-0 !text-current !border-0 !rounded-enterprise-sm hover:!bg-vidis-hover-green/20"
                actionFn={handleOpenNewChat}
              >
                <TrashFilledIcon className="text-primary h-4 w-4" />
              </DestructiveActionButton>

              {/* This invisible button is a hack to get the chat name to be in the middle so 
              that we don't neeed manual padding since there are two buttons on the right but 
              only one on the left */}
              <button className="flex justify-center invisible items-center w-8 h-8 group disabled:bg-light-gray disabled:text-gray-100 group !px-0 !py-0 !text-current !border-0 !rounded-enterprise-sm hover:!bg-vidis-hover-green/20">
                <TrashFilledIcon className="text-primary h-4 w-4" />
              </button>
            </>
          )}

          {chatActive && <div className="flex-grow" />}
          {messages.length > 0 && (
            <span className={cn('text-xl font-normal truncate max-w-sm')}>
              {sharedSchoolChat.name}
            </span>
          )}
          <div className="flex-grow" />

          <DownloadSharedConversationButton
            conversationMessages={messages}
            disabled={!chatActive || messages.length === 0}
            sharedConversationName={sharedSchoolChat.name}
          />
          <UnauthenticatedProfileMenu />
        </header>
        <div className="flex flex-col flex-1 justify-between items-center w-full overflow-hidden">
          <div
            ref={scrollRef}
            className="flex-grow w-full max-w-[50rem] overflow-y-auto p-4 pb-[5rem]"
            style={{ maxHeight: 'calc(100vh - 150px)' }}
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-3xl font-medium truncate max-w-sm">
                  {sharedSchoolChat.name}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {messages.map((message, index) => {
                  const isLastNonUser = index === messages.length - 1 && message.role !== 'user';

                  return (
                    <div
                      key={index}
                      className={cn(
                        'w-full text-secondary-foreground',
                        message.role === 'user' &&
                          'w-fit p-4 rounded-2xl rounded-br-none self-end bg-secondary/20 text-primary-foreground max-w-[70%] break-words',
                      )}
                    >
                      <div
                        className=""
                        aria-label={`${message.role} message ${Math.floor(index / 2 + 1)}`}
                      >
                        <MarkdownDisplay>{message.content}</MarkdownDisplay>

                        {isLastNonUser && !isLoading && (
                          <div className="flex items-center gap-1 mt-1">
                            <TelliClipboardButton text={message.content} />
                            <button
                              title="Reload last message"
                              type="button"
                              onClick={() => reload()}
                              aria-label="Reload"
                            >
                              <div className="p-1.5 rounded-enterprise-sm hover:bg-vidis-hover-green/20">
                                <ReloadIcon className="text-primary w-5 h-5" />
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {error && (
              <div className="mx-4 p-4 gap-2 text-sm rounded-2xl bg-red-100 text-red-500 border border-red-500 text-right mt-8">
                <div className="flex justify-between items-center px-2">
                  {error.message || 'An error occurred'}
                  <button
                    onClick={() => reload()}
                    type="button"
                    className="hover:bg-red-200 p-2 rounded-lg"
                  >
                    <ReloadIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-full max-w-3xl mx-auto px-4 pb-4">
            <div className="flex flex-col">
              <form
                onSubmit={customHandleSubmit}
                className="bg-white w-full p-1 border focus-within:border-primary rounded-xl"
              >
                <div className="flex items-center">
                  <AutoResizeTextarea
                    autoFocus
                    placeholder={tCommon('send-message-placeholder')}
                    className="w-full text-base focus:outline-none bg-transparent max-h-[10rem] sm:max-h-[15rem] overflow-y-auto placeholder-black p-2"
                    onChange={handleInputChange}
                    value={input}
                    onKeyDown={handleSubmitOnEnter}
                    maxLength={20000}
                  />
                  {isLoading ? (
                    <button
                      type="button"
                      title="Stop generating"
                      onClick={() => stop()}
                      className="p-1.5 my-2 flex items-center justify-center group disabled:cursor-not-allowed rounded-enterprise-sm hover:bg-secondary/20 me-2"
                      aria-label="Stop"
                    >
                      <StopIcon className="w-6 h-6 text-dark-gray group-disabled:bg-gray-200 group-disabled:text-gray-100 rounded-enterprise-sm text-primary group-hover:bg-secondary/20" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      title="Send message"
                      disabled={input.trim().length === 0}
                      className="flex items-center self-end justify-center group disabled:cursor-not-allowed rounded-enterprise-sm me-2 py-2"
                      aria-label="Send Message"
                    >
                      <ArrowRightIcon className="w-9 h-9 text-dark-gray group-hover:bg-secondary/20 group-disabled:bg-gray-200 group-disabled:text-gray-100 rounded-enterprise-sm text-primary" />
                    </button>
                  )}
                </div>
              </form>
              <span className="text-xs mt-2 font-normal text-main-900 flex self-center text-center">
                {tCommon('information-disclaimer')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function constructLocalStorageKey({ id, inviteCode }: { id: string; inviteCode: string }) {
  return `shared-chat-${id}-${inviteCode}`;
}

function getMaybeLocaleStorageChats({ id, inviteCode }: { id: string; inviteCode: string }) {
  const value = readFromLocalStorage(constructLocalStorageKey({ id, inviteCode }));
  if (value === null) return undefined;
  try {
    const json = JSON.parse(value);
    const parsedValue = z
      .array(z.object({ role: messageRoleSchema, content: z.string() }))
      .parse(json);
    return parsedValue;
  } catch (error: unknown) {
    console.error({ error });
    return undefined;
  }
}
