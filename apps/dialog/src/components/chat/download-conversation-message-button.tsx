'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@ui/components/Button';
import { useToast } from '@/components/common/toast';
import WebDownloadIcon from '@/components/icons/web-download';

type DownloadConversationMessageButtonProps = {
  conversationId: string;
  messageId: string;
  gptName?: string;
};

export default function DownloadConversationMessageButton({
  conversationId,
  messageId,
  gptName,
}: DownloadConversationMessageButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const tCommon = useTranslations('common');

  async function handleDownload() {
    try {
      setIsLoading(true);

      const searchParams = new URLSearchParams();
      searchParams.set('conversationId', conversationId);
      searchParams.set('messageId', messageId);

      if (gptName) {
        searchParams.append('enterpriseGptName', gptName);
      }

      const response = await fetch(`/api/download-conversation?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to download the document');
      }

      const encodedFileName = response.headers.get('X-Filename');
      const fileName = encodedFileName
        ? decodeURIComponent(encodedFileName)
        : `Nachricht_${messageId}.docx`;

      const blob = await response.blob();
      downloadFileFromBlob(blob, fileName);
    } catch {
      toast.error(tCommon('message-download-error'));
    } finally {
      setIsLoading(false);
    }
  }

  const label = tCommon('message-download');

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      type="button"
      onClick={handleDownload}
      disabled={isLoading}
      aria-label={label}
      className="text-primary"
    >
      <WebDownloadIcon className="size-4" />
    </Button>
  );
}

function downloadFileFromBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);

  document.body.appendChild(link);
  link.click();

  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}
