'use client';

import { useChat, type Message } from '@ai-sdk/react';
import React, { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLlmModels } from '../providers/llm-model-provider';
import { type CustomGptModel, type CharacterModel, FileModel } from '@/db/schema';
import TelliLogo from '../icons/logo';
import PromptSuggestions from './prompt-suggestions';
import MarkdownDisplay from './markdown-display';
import { navigateWithoutRefresh } from '@/utils/navigation/router';
import { generateUUID } from '@/utils/uuid';
import { useQueryClient } from '@tanstack/react-query';
import RobotIcon from '../icons/robot';
import { useRouter } from 'next/navigation';
import { LocalFileState } from './send-message-form';
import { deepCopy } from '@/utils/object';
import { ChatBox } from './chat-box';
import { getFileExtension } from '@/utils/files/generic';
import { refetchFileMapping } from '@/app/(authed)/(dialog)/actions';
import { InitialChatContentDisplay } from './initial-content-display';
import { HELP_MODE_GPT_ID } from '@/db/const';
import { ChatInputBox } from './chat-input-box';
import { ErrorChatPlaceholder } from './error-message';
import Image from 'next/image';

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
      fileIds: Array.from(files).map(([, file]) => file.fileId),
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
      router.refresh();
    },
    onFinish: () => {
      if (messages.length > 1) {
        return;
      }
      refetchConversations();
    },
  });

  const scrollRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setFileMapping(await refetchFileMapping(id));
    };
    fetchData();
  }, [countOfFilesInChat, id]);

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
        Array.from(files).map(([, file]) => {
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

  const formatedSubHeading = tHelpMode('chat-subheading', { FAQ_LINK: tHelpMode('faq-link') });

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

  let placeholderElement: React.JSX.Element;

  if (character !== undefined) {
    placeholderElement = (
      <InitialChatContentDisplay
        title={character.name}
        imageSource={imageSource}
        description={character.description}
      />
    );
  } else if (customGpt !== undefined && customGpt.id === HELP_MODE_GPT_ID) {
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
      <InitialChatContentDisplay
        title={customGpt.name}
        imageSource={imageSource}
        description={customGpt.description ?? undefined}
      />
    );
  } else {
    placeholderElement = (
      <div className="flex items-center justify-center h-full">
        <TelliLogo className="text-primary" />
      </div>
    );
  }

  const assistantIcon = getAssistantIcon({
    customGptId: customGpt?.id,
    imageName: character?.name ?? customGpt?.name,
    imageSource,
  });

  const messagesContent = (
    <div className="flex flex-col gap-2 max-w-3xl mx-auto p-4">
      {messages.map((message, index) => (
        <ChatBox
          key={index}
          index={index}
          fileMapping={fileMapping}
          isLastUser={index === messages.length - 1 && message.role == 'user'}
          isLastNonUser={index === messages.length - 1 && message.role !== 'user'}
          isLoading={isLoading}
          regenerateMessage={reload}
          initialFiles={initialFiles}
          assistantIcon={assistantIcon}
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
          <ErrorChatPlaceholder error={error} handleReload={reload} />
        </div>
        <div className="w-full max-w-3xl pb-4 px-4 mx-auto">
          <div className="relative flex flex-col">
            <PromptSuggestions
              suggestions={promptSuggestions}
              onSelectSuggestion={(suggestion) => setInput(suggestion)}
              hidden={input.length > 0 || messages.length > 0}
            />
            <ChatInputBox
              files={files}
              setFiles={setFiles}
              customHandleSubmit={customHandleSubmit}
              handleStopGeneration={stop}
              enableFileUpload={enableFileUpload}
              handleDeattachFile={handleDeattachFile}
              handleInputChange={handleInputChange}
              input={input}
              isLoading={isLoading}
            />
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

export function getAssistantIcon({
  customGptId: customGptId,
  imageName,
  imageSource,
}: {
  customGptId?: string;
  imageName?: string;
  imageSource?: string;
}) {
  if (customGptId === HELP_MODE_GPT_ID) {
    return (
      <div className="rounded-enterprise-sm bg-secondary/5 w-8 h-8 place-self-start m-4 mt-1">
        <RobotIcon className="w-8 h-8 text-primary p-1" />
      </div>
    );
  }
  if (imageSource !== undefined && imageName !== undefined) {
    return (
      <div className="p-1.5 place-self-start m-4 mt-1 ">
        <Image
          src={imageSource}
          width={30}
          height={30}
          alt={imageName}
          className="rounded-enterprise-sm"
          // this is neccessarly for it rendering correctly in safari
          style={{
            minWidth: '2.5rem',
          }}
        />
      </div>
    );
  }
}
