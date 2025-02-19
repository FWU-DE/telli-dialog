'use client';

import WebDownloadIcon from '@/components/icons/web-download';
import React from 'react';
import Spinner from '@/components/icons/spinner';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';

type DownloadConversationButtonProps = {
  conversationId: string;
  characterName?: string;
  className?: React.ComponentProps<'button'>['className'];
  iconClassName?: string;
  disabled: boolean;
};

export default function DownloadConversationButton({
  conversationId,
  characterName,
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

  const t = useTranslations('conversation-download');

  return (
    <button
      className="hidden xs:flex justify-center items-center w-8 h-8 group disabled:bg-light-gray disabled:text-gray-100 group rounded-enterprise-sm hover:bg-vidis-hover-green/20"
      title={t('title')}
      onClick={handleDownload}
      disabled={disabled}
    >
      {isLoading ? (
        <Spinner className="p-2 w-8 h-8" />
      ) : (
        <WebDownloadIcon className="text-primary group-disabled:text-gray-100" />
      )}
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
