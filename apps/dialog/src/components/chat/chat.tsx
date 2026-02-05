'use client';

import { useMainChat, type ChatMessage } from '@/hooks/use-chat-hooks';
import { FormEvent, ReactNode, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLlmModels } from '../providers/llm-model-provider';
import { type CharacterSelectModel, type CustomGptSelectModel, FileModel } from '@shared/db/schema';
import PromptSuggestions from './prompt-suggestions';
import MarkdownDisplay from './markdown-display';
import { navigateWithoutRefresh } from '@/utils/navigation/router';
import { useQueryClient } from '@tanstack/react-query';
import RobotIcon from '../icons/robot';
import { LocalFileState } from './send-message-form';
import { deepCopy } from '@/utils/object';
import { getFileExtension } from '@/utils/files/generic';
import { refetchFileMapping } from '@/app/(authed)/(dialog)/actions';
import { InitialChatContentDisplay } from './initial-content-display';
import { HELP_MODE_GPT_ID } from '@shared/db/const';
import { ChatInputBox } from './chat-input-box';
import { ErrorChatPlaceholder } from './error-chat-placeholder';
import { logDebug, logWarning } from '@shared/logging';
import { useSession } from 'next-auth/react';
import { AssistantIcon } from './assistant-icon';
import { messageContainsAttachments } from '@/utils/chat/messages';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { getConversationPath } from '@/utils/chat/path';
import { Messages } from './messages';
import { toUIMessages } from '@/types/chat';
import { WebsearchSource } from '@shared/db/types';
import { useCheckStatusCode } from '@/hooks/use-response-status';

type ChatProps = {
  id: string;
  initialMessages: ChatMessage[];
  customGpt?: CustomGptSelectModel;
  character?: CharacterSelectModel;
  imageSource?: string;
  promptSuggestions?: string[];
  initialFileMapping?: Map<string, FileModel[]>;
  enableFileUpload: boolean;
  webSourceMapping?: Map<string, WebsearchSource[]>;
  logoElement: ReactNode;
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
  webSourceMapping,
  logoElement,
}: ChatProps) {
  const tHelpMode = useTranslations('help-mode');

  const { selectedModel } = useLlmModels();
  const conversationPath = getConversationPath({
    customGptId: customGpt?.id,
    characterId: character?.id,
    conversationId: id,
  });
  const [initialFiles, setInitialFiles] = useState<FileModel[]>();
  const [fileMapping, setFileMapping] = useState<Map<string, FileModel[]>>(
    initialFileMapping ?? new Map(),
  );
  const [files, setFiles] = useState<Map<string, LocalFileState>>(new Map());
  const [countOfFilesInChat, setCountOfFilesInChat] = useState(0);
  const [lastMessageHasAttachments, setLastMessageHasAttachments] = useState(false);
  const queryClient = useQueryClient();
  const session = useSession();

  function refetchConversations() {
    void queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }

  const { messages, input, setInput, handleInputChange, handleSubmit, reload, stop, status } =
    useMainChat({
      conversationId: id,
      initialMessages: initialMessages,
      modelId: selectedModel?.id,
      characterId: character?.id,
      customGptId: customGpt?.id,
      onFinish: (message) => {
        logDebug(`onFinish called with message ${JSON.stringify(message)}`);
        // Trigger refetch of the fileMapping from the DB
        setCountOfFilesInChat(countOfFilesInChat + 1);
        if (messages.length > 1) {
          return;
        }
        logWarning('Assert: onFinish was called with zero assistant messages.');
        refetchConversations();
      },
      onError: (error) => {
        handleError(error);
        refetchConversations();
      },
    });

  const { error, handleError, resetError } = useCheckStatusCode();

  // Convert to Vercel AI Message format for compatibility with existing components
  const aiMessages = toUIMessages(messages);

  const scrollRef = useAutoScroll([messages, status]);

  useEffect(() => {
    const fetchData = async () => {
      const fileMapping = await refetchFileMapping(id);
      setFileMapping(fileMapping);
    };
    void fetchData();
  }, [countOfFilesInChat, id]);

  async function customHandleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      setLastMessageHasAttachments(messageContainsAttachments(input, files));
      resetError;

      // Trigger refetch of the fileMapping from the DB
      setCountOfFilesInChat(countOfFilesInChat + 1);

      // If this is the first message, update navigation and refetch
      if (messages.length === 0) {
        navigateWithoutRefresh(conversationPath);
        refetchConversations();
      }

      await handleSubmit(e, {
        fileIds: Array.from(files)
          .map(([, file]) => file.fileId)
          .filter(Boolean) as string[],
      });

      setInitialFiles(
        Array.from(files).map(([, file]) => ({
          id: file.fileId ?? '',
          name: file.file.name,
          type: getFileExtension(file.file.name),
          createdAt: new Date(),
          size: file.file.size,
          metadata: null,
        })),
      );
      setFiles(new Map());
    } catch (error) {
      console.error(error);
    }
  }

  function handleReload() {
    resetError();
    void reload();
  }

  function formatSupportAdressesToString(arr: string[]): string {
    if (arr.length === 0) return '';
    if (arr.length === 1) return arr[0]!;

    const allButLast = arr.slice(0, -1).join(', ');
    const last = arr[arr.length - 1];
    return `${allButLast} ${tHelpMode('support-addresses-concat')} ${last}`;
  }
  const formatedSubHeading = tHelpMode('chat-subheading', {
    FAQ_LINK: tHelpMode('faq-link'),
    SUPPORT_ADRESSES: formatSupportAdressesToString(
      session.data?.user?.federalState?.supportContacts ?? [],
    ),
  });

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

  let placeholderElement: ReactNode;

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
      <div className="flex items-center justify-center h-full">{logoElement}</div>
    );
  }

  const assistantIcon = AssistantIcon({
    customGptId: customGpt?.id,
    imageName: character?.name ?? customGpt?.name,
    imageSource,
  });

  const isLoading = status === 'submitted';

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex flex-col flex-grow justify-between w-full overflow-hidden">
        <div ref={scrollRef} className="flex-grow overflow-y-auto">
          {messages.length === 0 ? (
            placeholderElement
          ) : (
            <Messages
              messages={aiMessages}
              isLoading={isLoading}
              status={status}
              reload={reload}
              assistantIcon={assistantIcon}
              doesLastUserMessageContainLinkOrFile={lastMessageHasAttachments}
              containerClassName="flex flex-col gap-2 max-w-3xl mx-auto p-4"
              fileMapping={fileMapping}
              initialFiles={initialFiles}
              webSourceMapping={webSourceMapping}
            />
          )}
          {error && <ErrorChatPlaceholder error={error} handleReload={handleReload} />}
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
