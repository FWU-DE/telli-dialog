'use client';

import { useMainChat, type ChatMessage } from '@/hooks/use-chat-hooks';
import React, { FormEvent, ReactNode, useEffect, useState } from 'react';
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
import { getFileExtension, isImageFile } from '@/utils/files/generic';
import { refetchFileMapping } from '@/app/(authed)/(dialog)/actions';
import { InitialChatContentDisplay } from './initial-content-display';
import { HELP_MODE_GPT_ID } from '@shared/db/const';
import { ChatInputBox } from './chat-input-box';
import { ErrorChatPlaceholder } from './error-chat-placeholder';
import { logError, logDebug, logWarning } from '@shared/logging';
import { useSession } from 'next-auth/react';
import { AssistantIcon } from './assistant-icon';
import { useAutoScroll } from '@/hooks/use-auto-scroll';
import { getConversationPath } from '@/utils/chat/path';
import { Messages, type PendingFileModel } from './messages';
import { useRouter } from 'next/navigation';
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
  const [fileMapping, setFileMapping] = useState<Map<string, FileModel[]>>(
    initialFileMapping ?? new Map(),
  );
  // pendingFileMapping stores files for messages that haven't been persisted to DB yet
  // This allows immediate display of attachments while the server processes the message
  const [pendingFileMapping, setPendingFileMapping] = useState<Map<string, PendingFileModel[]>>(
    new Map(),
  );
  const [files, setFiles] = useState<Map<string, LocalFileState>>(new Map());
  const [countOfFilesInChat, setCountOfFilesInChat] = useState(0);
  const queryClient = useQueryClient();
  const session = useSession();

  function refetchConversations() {
    void queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }

  // Ref to hold pending files that will be associated with the next user message
  const pendingFilesRef = React.useRef<PendingFileModel[]>([]);

  // Router sync: We use window.history.replaceState() to update the URL immediately
  // on first message (no reload). This bypasses Next.js router, so router.push('/')
  // won't work until we sync. After streaming completes, we call router.replace()
  // via state + useEffect to avoid "setState during render" errors & odd behavior when navigating.
  const isFirstMessageRef = React.useRef(false);
  const [needsRouterSync, setNeedsRouterSync] = React.useState(false);
  const router = useRouter();

  // Sync Next.js router with the URL after first message completes (deferred to avoid setState during render)
  useEffect(() => {
    if (needsRouterSync) {
      setNeedsRouterSync(false);
      router.replace(conversationPath);
    }
  }, [needsRouterSync, conversationPath, router]);

  const {
    messages,
    uiMessages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    reload,
    stop,
    status,
  } = useMainChat({
    conversationId: id,
    initialMessages: initialMessages,
    modelId: selectedModel?.id,
    characterId: character?.id,
    customGptId: customGpt?.id,
    onMessageCreated: (messageId) => {
      // Associate pending files with the message ID immediately when the message is created
      const filesToAssociate = pendingFilesRef.current;
      if (filesToAssociate.length > 0) {
        setPendingFileMapping((prev) => {
          const newMap = new Map(prev);
          newMap.set(messageId, filesToAssociate);
          return newMap;
        });
        pendingFilesRef.current = [];
      }
    },
    onFinish: (message) => {
      logDebug(`onFinish called with message ${JSON.stringify(message)}`);
      // Trigger refetch of the fileMapping from the DB
      setCountOfFilesInChat(countOfFilesInChat + 1);

      // Signal that we need to sync the router (done in useEffect to avoid setState during render)
      if (isFirstMessageRef.current) {
        isFirstMessageRef.current = false;
        // Preserve scroll state across the remount caused by router.replace()
        preserveScrollState();
        setNeedsRouterSync(true);
      }

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

  const { scrollRef, reactivateAutoScrolling, preserveScrollState } = useAutoScroll([
    messages,
    status,
  ]);

  useEffect(() => {
    // Skip fetching file mappings if the conversation doesn't exist yet (no messages sent)
    if (messages.length === 0) {
      return;
    }

    const fetchData = async () => {
      const newFileMapping = await refetchFileMapping(id);
      setFileMapping(newFileMapping);

      // Clean up pending files that now have DB entries
      // This also revokes blob URLs to prevent memory leaks
      setPendingFileMapping((prev) => {
        const updated = new Map(prev);
        for (const [messageId, files] of prev) {
          if (newFileMapping.has(messageId)) {
            // Revoke blob URLs before removing
            for (const file of files) {
              if (file.localUrl) {
                URL.revokeObjectURL(file.localUrl);
              }
            }
            updated.delete(messageId);
          }
        }
        return updated;
      });
    };
    void fetchData();
  }, [countOfFilesInChat, id, messages.length]);

  async function customHandleSubmit(e: FormEvent) {
    e.preventDefault();

    try {
      reactivateAutoScrolling();
      resetError();

      // Trigger refetch of the fileMapping from the DB
      setCountOfFilesInChat(countOfFilesInChat + 1);

      // If this is the first message, update navigation and refetch
      if (messages.length === 0) {
        navigateWithoutRefresh(conversationPath);
        isFirstMessageRef.current = true; // Will sync router after request completes
        refetchConversations();
      }

      // Set pending files BEFORE handleSubmit so they can be associated with the message ID
      // when onMessageCreated is called
      const currentFiles = Array.from(files);
      pendingFilesRef.current = currentFiles.map(([, file]) => ({
        id: file.fileId ?? '',
        name: file.file.name,
        type: getFileExtension(file.file.name),
        createdAt: new Date(),
        size: file.file.size,
        metadata: null,
        userId: null,
        // Create a blob URL for images so they display immediately without fetching from S3
        localUrl: isImageFile(file.file.name) ? URL.createObjectURL(file.file) : undefined,
      }));

      // Capture fileIds before clearing the files state
      const fileIds = currentFiles.map(([, file]) => file.fileId).filter(Boolean) as string[];

      // Clear files immediately so UI updates
      setFiles(new Map());

      await handleSubmit(e, { fileIds });
    } catch (error) {
      logError('Error in handleSubmitWithFiles', error);
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
        logWarning('Could not delete file', { localFileId });
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
      <div className="flex flex-col grow justify-between w-full overflow-hidden">
        <div ref={scrollRef} className="grow overflow-y-auto">
          {messages.length === 0 ? (
            placeholderElement
          ) : (
            <Messages
              messages={uiMessages}
              isLoading={isLoading}
              status={status}
              reload={reload}
              assistantIcon={assistantIcon}
              containerClassName="flex flex-col gap-2 max-w-3xl mx-auto p-4"
              fileMapping={fileMapping}
              pendingFileMapping={pendingFileMapping}
              webSourceMapping={webSourceMapping}
            />
          )}
          {error && <ErrorChatPlaceholder error={error} handleReload={handleReload} />}
        </div>
        <div className="w-full max-w-3xl pb-4 px-4 mx-auto">
          <div className="relative flex flex-col">
            {input.length === 0 && messages.length === 0 && (
              <PromptSuggestions
                suggestions={promptSuggestions}
                onSelectSuggestion={(suggestion) => setInput(suggestion)}
              />
            )}
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
