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
  //  für den Namen des Sprachmodells
  llmName: string;
  className?: React.ComponentProps<'button'>['className'];
  iconClassName?: string;
  disabled: boolean;
};

//llmName  hinzugefügt
export default function DownloadConversationButton({
  conversationId,
  characterName,
  llmName,
  disabled = true,
}: DownloadConversationButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const toast = useToast();

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
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Error downloading document');
    } finally {
      setIsLoading(false);
    }
  }

  const t = useTranslations('common');

  return (
    <button
      className={cn(
        'hidden xs:flex justify-center items-center w-8 h-8 group',
        iconClassName,
        'disabled:hover:bg-transparent',
      )}
      title={t('conversation-download')}
      onClick={handleDownload}
      disabled={disabled}
    >
      {isLoading ? <Spinner className="p-2 w-8 h-8" /> : <WebDownloadIcon />}
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
