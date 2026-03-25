'use client';

import { FileStatus } from './upload-file-button';
import { ConversationMessageMetadata } from '@shared/utils/chat';
import { AssistantSelectModel } from '@shared/db/schema';

export type SendMessageProps = {
  className?: string;
  disabled?: boolean;
  chatDisabled?: boolean;
  onSubmit: (data: {
    message: string;
    metadata: ConversationMessageMetadata | null;
  }) => Promise<void>;
  onFocus?: () => void;
  onButtonClickWhenChatDisabled?(): void;
  assistantName: string | undefined;
  stopResponseGeneration?: () => void;
  messages: string[];
  assistant?: AssistantSelectModel;
  hideStartMessages?: boolean;
};

export type LocalFileState = {
  file: File;
  status: FileStatus;
  fileId: string | undefined;
};
