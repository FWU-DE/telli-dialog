'use client';

import React from 'react';
import Spinner from '@/components/icons/spinner';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import { type ChatMessage as Message } from '@/types/chat';
import { Button } from '@ui/components/button';
import { BoxArrowDownIcon } from '@phosphor-icons/react';
import { downloadFileFromBlob, extractFilenameFromResponse } from '@/utils/files/blob-download';

type DownloadConversationButtonProps = {
  conversationMessages: Message[];
  className?: React.ComponentProps<'button'>['className'];
  disabled: boolean;
  primaryButton?: boolean;
  sharedConversationName?: string;
  characterName?: string;
  showText?: boolean;
  inviteCode: string;
};

type DownloadSharedConversationParams = {
  conversationMessages: Message[];
  sharedConversationName?: string;
  characterName?: string;
  inviteCode: string;
};

export async function fetchSharedConversationDownload({
  conversationMessages,
  sharedConversationName,
  characterName,
  inviteCode,
}: DownloadSharedConversationParams) {
  const response = await fetch(`/api/download-conversation/shared`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: conversationMessages,
      characterName,
      sharedConversationName,
      inviteCode,
    }),
  });

  const fileName = extractFilenameFromResponse(response, 'Konversation_AIS.chat.docx');

  if (!response.ok) {
    throw new Error('Failed to download the document');
  }

  return {
    blob: await response.blob(),
    fileName,
  };
}

export default function DownloadSharedConversationButton({
  conversationMessages,
  disabled = true,
  primaryButton,
  sharedConversationName,
  characterName,
  showText = true,
  inviteCode,
}: DownloadConversationButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const isMountedRef = React.useRef(true);
  const toast = useToast();
  const tCommon = useTranslations('common');

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  async function handleDownload() {
    if (disabled) {
      return;
    }

    try {
      setIsLoading(true);

      const { blob, fileName } = await fetchSharedConversationDownload({
        conversationMessages,
        sharedConversationName,
        characterName,
        inviteCode,
      });

      downloadFileFromBlob(blob, fileName);
    } catch {
      toast.error('Der Download der Konversation ist fehlgeschlagen.');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }

  if (primaryButton) {
    return (
      <Button
        variant={showText ? 'outline' : 'ghost'}
        size={showText ? 'default' : 'icon-round'}
        className="text-primary"
        title={tCommon('conversation-download')}
        onClick={handleDownload}
        disabled={disabled}
      >
        <div className="flex items-center gap-1">
          {isLoading ? (
            <Spinner className="p-2 size-8" />
          ) : (
            <BoxArrowDownIcon className="size-6 text-primary" />
          )}
          {showText && tCommon('conversation-download')}
        </div>
      </Button>
    );
  }

  return (
    <Button
      variant={showText ? 'outline' : 'ghost'}
      size={showText ? 'default' : 'icon-round'}
      className="text-primary"
      title={tCommon('conversation-download')}
      onClick={handleDownload}
      disabled={disabled}
    >
      {isLoading ? (
        <Spinner className="p-2 size-8" />
      ) : (
        <BoxArrowDownIcon className="size-6 text-primary" />
      )}
      {showText && tCommon('conversation-download')}
    </Button>
  );
}
