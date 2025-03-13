'use client';

import WebDownloadIcon from '@/components/icons/web-download';
import React from 'react';
import Spinner from '@/components/icons/spinner';
import { useToast } from '@/components/common/toast';
import { useTranslations } from 'next-intl';
import { Message } from 'ai';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { cn } from '@/utils/tailwind';

type DownloadConversationButtonProps = {
  conversationMessages: Message[];
  className?: React.ComponentProps<'button'>['className'];
  iconClassName?: string;
  disabled: boolean;
  primaryButton?: boolean;
  sharedConversationName?: string;
  characterName?: string;
};

export default function DownloadSharedConversationButton({
  conversationMessages,
  disabled = true,
  primaryButton,
  sharedConversationName,
  characterName,
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
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Error downloading document');
    } finally {
      setIsLoading(false);
    }
  }

  if (primaryButton) {
    return (
      <button
        className={cn(buttonPrimaryClassName, 'text-base font-normal')}
        title={tCommon('conversation-download')}
        onClick={handleDownload}
        disabled={disabled}
      >
        <div className="flex items-center gap-1">
          {isLoading ? (
            <Spinner className="p-2 w-8 h-8" />
          ) : (
            <WebDownloadIcon className="group-disabled:text-gray-100 w-6 h-6" />
          )}
          Dialog herunterladen
        </div>
      </button>
    );
  }

  return (
    <button
      className="flex justify-center items-center w-8 h-8 group disabled:bg-light-gray disabled:text-gray-100 group rounded-enterprise-sm hover:bg-vidis-hover-green/20"
      title={tCommon('conversation-download')}
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
