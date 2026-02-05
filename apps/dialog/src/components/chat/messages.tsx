import { type UIMessage, type ChatStatus } from '@/types/chat';
import { ChatBox, type PendingFileModel } from './chat-box';
import LoadingAnimation from './loading-animation';
import { FileModel } from '@shared/db/schema';
import { WebsearchSource } from '@shared/db/types';

// Re-export for consumers that import from this file
export type { ChatStatus, PendingFileModel };

interface MessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
  status: ChatStatus;
  reload: () => void;
  assistantIcon?: React.ReactNode;
  doesLastUserMessageContainLinkOrFile: boolean;
  containerClassName: string;
  fileMapping?: Map<string, FileModel[]>;
  pendingFileMapping?: Map<string, PendingFileModel[]>;
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
  pendingFileMapping,
  webSourceMapping,
}: MessagesProps) {
  return (
    <div className={containerClassName}>
      {messages.map((message, index) => (
        <ChatBox
          key={index}
          index={index}
          fileMapping={fileMapping}
          pendingFileMapping={pendingFileMapping}
          isLastNonUser={index === messages.length - 1 && message.role !== 'user'}
          isLoading={isLoading}
          regenerateMessage={reload}
          assistantIcon={assistantIcon}
          websources={webSourceMapping?.get(message.id)}
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
