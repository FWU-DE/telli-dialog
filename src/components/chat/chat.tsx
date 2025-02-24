'use client';

import AutoResizeTextarea from '@/components/common/auto-resize-textarea';
import { cn } from '@/utils/tailwind';
import { useChat, type Message } from '@ai-sdk/react';
import ArrowRightIcon from '@/components/icons/arrow-right';
import ReloadIcon from '@/components/icons/reload';
import StopIcon from '@/components/icons/stop';
import React from 'react';
import { useTranslations } from 'next-intl';
import { useLlmModels } from '../providers/llm-model-provider';
import Image from 'next/image';
import { type CharacterModel } from '@/db/schema';
import TelliLogo from '../icons/logo';
import PromptSuggestions from './prompt-suggestions';
import MarkdownDisplay from './markdown-display';
import TelliClipboardButton from '../common/clipboard-button';
import { navigateWithoutRefresh } from '@/utils/navigation/router';
import { generateUUID } from '@/utils/uuid';

type ChatProps = {
  id: string;
  initialMessages: Message[];
  character?: CharacterModel;
  imageSource?: string;
  promptSuggestions?: string[];
};

export default function Chat({
  id,
  initialMessages,
  character,
  imageSource,
  promptSuggestions = [],
}: ChatProps) {
  const t = useTranslations('Chat');
  const { selectedModel } = useLlmModels();
  const conversationPath =
    character !== undefined ? `/characters/d/${character.id}/${id}` : `/d/${id}`;

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    reload,
    stop,
    error,
  } = useChat({
    id,
    initialMessages,
    api: '/api/chat',
    experimental_throttle: 100,
    maxSteps: 2,
    body: { id, modelId: selectedModel?.id, characterId: character?.id },
    generateId: generateUUID,
    sendExtraMessageFields: true,
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

      navigateWithoutRefresh(conversationPath);
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

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex flex-col flex-grow justify-between w-full overflow-hidden">
        <div ref={scrollRef} className="flex-grow overflow-y-auto">
          {messages.length === 0 ? (
            character !== undefined ? (
              <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto p-4">
                {imageSource !== undefined && (
                  <Image
                    src={imageSource}
                    width={100}
                    height={100}
                    alt={character.name}
                    className="rounded-enterprise-md"
                  />
                )}
                <h1 className="text-2xl font-medium mt-8">{character.name}</h1>
                <p className="max-w-72">{character.description}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <TelliLogo className="text-primary" />
              </div>
            )
          ) : (
            <div className="flex flex-col gap-8 max-w-3xl mx-auto p-4">
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
                    <div className="">
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
                {error.message || 'Etwas ist schiefgelaufen'}
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
        <div className="w-full max-w-3xl pb-4 px-4 mx-auto">
          <div className="relative flex flex-col">
            <PromptSuggestions
              suggestions={promptSuggestions}
              onSelectSuggestion={(suggestion) => setInput(suggestion)}
              hidden={input.length > 0 || messages.length > 0}
            />
            <form
              onSubmit={customHandleSubmit}
              className="relative bg-white w-full p-1 border focus-within:border-primary rounded-xl"
            >
              <div className="flex items-center">
                <AutoResizeTextarea
                  autoFocus
                  placeholder={t('send-message-placeholder')}
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
                    className="my-2 mx-2 flex items-center self-end justify-center group disabled:cursor-not-allowed text-dark-gray hover:bg-secondary/20 disabled:bg-gray-200 disabled:text-gray-100 rounded-enterprise-sm text-primary"
                    aria-label="Send Message"
                  >
                    <ArrowRightIcon className="h-9 w-9" />
                  </button>
                )}
              </div>
            </form>
            <span className="text-xs mt-2 font-normal text-main-900 flex self-center text-center">
              {t('information-disclaimer')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
