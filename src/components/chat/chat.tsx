'use client';

import AutoResizeTextarea from '@/components/common/auto-resize-textarea';
import { useChat, type Message } from '@ai-sdk/react';
import ArrowRightIcon from '@/components/icons/arrow-right';
import ReloadIcon from '@/components/icons/reload';
import StopIcon from '@/components/icons/stop';
import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLlmModels } from '../providers/llm-model-provider';
import Image from 'next/image';
import { type CustomGptModel, type CharacterModel, FileModel } from '@/db/schema';
import TelliLogo from '../icons/logo';
import PromptSuggestions from './prompt-suggestions';
import MarkdownDisplay from './markdown-display';
import { navigateWithoutRefresh } from '@/utils/navigation/router';
import { generateUUID } from '@/utils/uuid';
import { useQueryClient } from '@tanstack/react-query';
import RobotIcon from '../icons/robot';
import { useRouter } from 'next/navigation';
import { CHAT_MESSAGE_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import UploadFileButton from './upload-file-button';
import { LocalFileState } from './send-message-form';
import DisplayUploadedFile from './display-uploaded-file';
import { deepCopy } from '@/utils/object';
import { ChatBox } from './chat-box';
import { getFileExtension } from '@/utils/files/generic';
import { refetchFileMapping } from '@/app/(authed)/(dialog)/actions';
import { NUMBER_OF_FILES_LIMIT } from '@/utils/chat/const';

type ChatProps = {
  id: string;
  initialMessages: Message[];
  customGpt?: CustomGptModel;
  character?: CharacterModel;
  imageSource?: string;
  promptSuggestions?: string[];
  initialFileMapping?: Map<string, FileModel[]>;
  enableFileUpload: boolean;
};

export default function Chat({
  id,
  initialMessages,
  customGpt,
  character,
  imageSource,
  promptSuggestions = [],
  initialFileMapping,
  enableFileUpload,
}: ChatProps) {
  const tCommon = useTranslations('common');
  const tHelpMode = useTranslations('help-mode');
  const router = useRouter();

  const { selectedModel } = useLlmModels();
  const conversationPath = getConversationPath({
    customGptId: customGpt?.id,
    characterId: character?.id,
    conversationId: id,
  });
  const [initialFiles, setInitialFiles] = React.useState<FileModel[]>();
  const [fileMapping, setFileMapping] = React.useState<Map<string, FileModel[]>>(
    initialFileMapping ?? new Map(),
  );
  const [files, setFiles] = React.useState<Map<string, LocalFileState>>(new Map());
  const [countOfFilesInChat, setCountOfFilesInChat] = React.useState(0);
  const queryClient = useQueryClient();

  function refetchConversations() {
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }

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
    body: {
      id,
      modelId: selectedModel?.id,
      characterId: character?.id,
      customGptId: customGpt?.id,
      fileIds: files
        .values()
        .toArray()
        .map((file) => file.fileId),
    },
    generateId: generateUUID,
    sendExtraMessageFields: true,
    onResponse: () => {
      // trigger refech of the fileMapping from the DB
      setCountOfFilesInChat(countOfFilesInChat + 1);
      if (messages.length > 1) {
        return;
      }

      refetchConversations();
    },
    onFinish: () => {
      if (messages.length > 1) {
        return;
      }

      refetchConversations();
      router.refresh();
    },
  });

  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setFileMapping(await refetchFileMapping(id));
    };
    fetchData();
  }, [countOfFilesInChat]);

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
      setInitialFiles(
        files
          .values()
          .toArray()
          .map((file) => {
            return {
              id: file.fileId ?? '',
              name: file.file.name,
              type: getFileExtension(file.file.name),
              createdAt: new Date(),
              size: file.file.size,
            };
          }),
      );
      setFiles(new Map());
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

  const chatSubHeading = tHelpMode('chat-subheading');
  const markdownLink = `[FAQ Seite](https://telli.schule/#faq)`;
  const formatedSubHeading = chatSubHeading.replace('$FAQ_LINK', markdownLink);

  function handleDeattachFile(localFileId: string) {
    setFiles((prev) => {
      const newMap = deepCopy(prev);
      const deleted = newMap.delete(localFileId);
      if (!deleted) {
        console.warn('Could not delete file');
      }
      return newMap;
    });
  }

  const userInputTextArea = (
    <AutoResizeTextarea
      autoFocus
      placeholder={tCommon('send-message-placeholder')}
      className="w-full text-base focus:outline-none bg-transparent max-h-[10rem] sm:max-h-[15rem] overflow-y-auto placeholder-black p-2"
      onChange={handleInputChange}
      value={input}
      onKeyDown={handleSubmitOnEnter}
      maxLength={CHAT_MESSAGE_LENGTH_LIMIT}
    />
  );

  /** Either Send or StopGeneration */
  const userActionButton = isLoading ? (
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
  );

  const nofFiles = Array.from(files).length;

  let placeholderElement: React.JSX.Element;

  if (character !== undefined) {
    placeholderElement = (
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
    );
  } else if (customGpt !== undefined && customGpt.name === 'Hilfe-Assistent') {
    placeholderElement = (
      <div className="flex flex-col items-center justify-center gap-6 h-full max-w-3xl mx-auto p-4">
        <div className="pb-4">
          <RobotIcon className="w-14 h-14 text-primary" />
        </div>
        <div className="flex flex-col items-center justify-center gap-4">
          <span className="text-3xl font-medium text-center">{tHelpMode('chat-heading')}</span>
          <span className="text-base font-normal text-center max-w-2xl">
            <MarkdownDisplay>{formatedSubHeading}</MarkdownDisplay>
          </span>
        </div>
        <span className="text-base font-normal">{tHelpMode('chat-placeholder')}</span>
      </div>
    );
  } else if (customGpt !== undefined) {
    placeholderElement = (
      <div className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto p-4">
        {imageSource !== undefined && (
          <Image
            src={imageSource}
            width={100}
            height={100}
            alt={customGpt.name}
            className="rounded-enterprise-md"
          />
        )}
        <h1 className="text-2xl font-medium mt-8">{customGpt.name}</h1>
        <p className="max-w-72">{customGpt.description}</p>
      </div>
    );
  } else {
    placeholderElement = (
      <div className="flex items-center justify-center h-full">
        <TelliLogo className="text-primary" />
      </div>
    );
  }

  const messagesContent = (
    <div className="flex flex-col gap-2 max-w-3xl mx-auto p-4">
      {messages.map((message, index) => (
        <ChatBox
          key={index}
          index={index}
          fileMapping={fileMapping}
          customGpt={customGpt}
          isLastNonUser={index === messages.length - 1 && message.role !== 'user'}
          isLoading={isLoading}
          regenerateMessage={reload}
          initialFiles={initialFiles}
        >
          {message}
        </ChatBox>
      ))}
    </div>
  );
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex flex-col flex-grow justify-between w-full overflow-hidden">
        <div ref={scrollRef} className="flex-grow overflow-y-auto">
          {messages.length === 0 ? placeholderElement : messagesContent}
          {error && (
            <div className="p-4 gap-2 mt-8 max-w-3xl mx-auto">
              <div className="flex justify-between items-center text-sm rounded-2xl bg-red-100 text-red-500 border border-red-500 text-right p-4">
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
              {nofFiles > 0 && (
                <div className="mx-2 py-2 flex gap-1 overflow-x-auto">
                  {Array.from(files).map(([localId, file]) => (
                    <DisplayUploadedFile
                      fileName={file.file.name}
                      key={localId}
                      status={file.status}
                      onDeattachFile={() => handleDeattachFile(localId)}
                    />
                  ))}
                </div>
              )}
              <div className="flex items-center">
                {userInputTextArea}
                {userActionButton}
              </div>
              {enableFileUpload && (
                <div className="flex flex-row gap-x-3">
                  <UploadFileButton
                    className="hover:bg-light-gray"
                    setFiles={setFiles}
                    disabled={files.values().toArray().length >= NUMBER_OF_FILES_LIMIT}
                  />
                </div>
              )}
            </form>
            <span className="text-xs mt-2 font-normal text-main-900 flex self-center text-center">
              {tCommon('information-disclaimer')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function getConversationPath({
  customGptId,
  characterId,
  conversationId,
}: {
  customGptId?: string;
  characterId?: string;
  conversationId: string;
}) {
  if (characterId !== undefined) {
    return `/characters/d/${characterId}/${conversationId}`;
  }

  if (customGptId !== undefined) {
    return `/custom/d/${customGptId}/${conversationId}`;
  }

  return `/d/${conversationId}`;
}
