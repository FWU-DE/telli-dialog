import { UIMessage } from 'ai';
import { UseChatHelpers } from '@ai-sdk/react';
import { ChatBox } from './chat-box';
import LoadingAnimation from './loading-animation';
import { FileModel } from '@shared/db/schema';
import { WebsearchSource } from '@shared/db/types';

interface MessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
  status: UseChatHelpers['status'];
  reload: () => void;
  assistantIcon?: React.ReactNode;
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
          websources={webSourceMapping?.get(message.id)}
          status={status}
        >
          {message}
        </ChatBox>
      ))}

      {isLoading && <LoadingAnimation />}
    </div>
  );
}
