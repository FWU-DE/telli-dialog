import { UIMessage } from 'ai';
import { UseChatHelpers } from '@ai-sdk/react';
import { ChatBox } from './chat-box';
import LoadingAnimation from './loading-animation';
import { FileModel } from '@shared/db/schema';
import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';

interface MessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
  status: UseChatHelpers['status'];
  reload: () => void;
  assistantIcon?: React.ReactNode;
  doesLastUserMessageContainLinkOrFile: boolean;
  containerClassName: string;
  fileMapping?: Map<string, FileModel[]>;
  initialFiles?: FileModel[];
  webSourceMapping?: Map<string, WebsearchSource[]>;
}

export function Messages({
  messages,
  isLoading,
  status,
  reload,
  assistantIcon,
  doesLastUserMessageContainLinkOrFile,
  containerClassName,
  fileMapping,
  initialFiles,
  webSourceMapping,
}: MessagesProps) {
  return (
    <div className={containerClassName}>
      {messages.map((message, index) => (
        <ChatBox
          key={index}
          index={index}
          fileMapping={fileMapping}
          isLastUser={index === messages.length - 1 && message.role === 'user'}
          isLastNonUser={index === messages.length - 1 && message.role !== 'user'}
          isLoading={isLoading}
          regenerateMessage={reload}
          initialFiles={initialFiles}
          assistantIcon={assistantIcon}
          initialWebsources={
            message.role === 'user' ? webSourceMapping?.get(message.id) : undefined
          }
          status={status}
        >
          {message}
        </ChatBox>
      ))}

      {isLoading && (
        <LoadingAnimation isExternalResourceUsed={doesLastUserMessageContainLinkOrFile} />
      )}
    </div>
  );
}
