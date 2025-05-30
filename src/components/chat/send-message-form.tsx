'use client';

import { FileStatus } from './upload-file-button';
import { ConversationMessageMetadata } from '@/utils/chat';
import { CustomGptModel } from '@/db/schema';

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
  customGPTName: string | undefined;
  stopResponseGeneration?: () => void;
  messages: string[];
  customGpt?: CustomGptModel;
  hideStartMessages?: boolean;
};

export type LocalFileState = {
  file: File;
  status: FileStatus;
  fileId: string | undefined;
};
