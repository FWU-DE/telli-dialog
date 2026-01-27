'use client';

import WebDownloadIcon from '@/components/icons/web-download';
import React from 'react';
import Spinner from '@/components/icons/spinner';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import { cn } from '@/utils/tailwind';
import { iconClassName } from '@/utils/tailwind/icon';

type DownloadConversationButtonProps = {
  conversationId: string;
  characterName?: string;
  disabled: boolean;
  showText?: boolean;
};

export default function DownloadConversationButton({
  conversationId,
  characterName,
  disabled = true,
  showText = false,
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

      const searchParams = new URLSearchParams({
        conversationId,
      });

      if (characterName !== undefined) {
        searchParams.append('enterpriseGptName', characterName);
      }

      const response = await fetch(`/api/download-conversation?${searchParams.toString()}`);
      const encodedFileName = response.headers.get('X-Filename')?.toString();

      const fileName =
        encodedFileName !== undefined
          ? decodeURIComponent(encodedFileName)
          : `Konversation_${conversationId}.docx`;

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

  const t = useTranslations('common');

  return (
    <button
      className={cn('flex items-center gap-1 pl-2', iconClassName, 'disabled:hover:bg-transparent')}
      title={t('conversation-download')}
      onClick={handleDownload}
      disabled={disabled}
    >
      {isLoading ? <Spinner className="p-2 w-8 h-8" /> : <WebDownloadIcon className="w-8 h-8" />}
      {showText && tCommon('conversation-download')}
    </button>
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
