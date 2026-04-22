'use client';

import WebDownloadIcon from '@/components/icons/web-download';
import React from 'react';
import Spinner from '@/components/icons/spinner';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import { type ChatMessage as Message } from '@/types/chat';
import { Button } from '@ui/components/Button';

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
  const toast = useToast();
  const tCommon = useTranslations('common');

  async function handleDownload() {
    if (disabled) {
      return;
    }

    try {
      setIsLoading(true);

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

      const encodedFileName = response.headers.get('X-Filename')?.toString();

      const fileName =
        encodedFileName !== undefined
          ? decodeURIComponent(encodedFileName)
          : `Konversation_telli.docx`;

      if (!response.ok) {
        throw new Error('Failed to download the document');
      }

      const blob = await response.blob();

      downloadFileFromBlob(blob, fileName);
    } catch {
      toast.error('Der Download der Konversation ist fehlgeschlagen.');
    } finally {
      setIsLoading(false);
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
          {isLoading ? <Spinner className="p-2 size-8" /> : <WebDownloadIcon className="size-8" />}
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
      {isLoading ? <Spinner className="p-2 size-8" /> : <WebDownloadIcon className="size-8" />}
      {showText && tCommon('conversation-download')}
    </Button>
  );
}

export function downloadFileFromBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);

  document.body.appendChild(link);
  link.click();

  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}
