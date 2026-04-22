import { DownloadSimpleIcon } from '@phosphor-icons/react/dist/icons/DownloadSimple';
import React from 'react';
import { useTranslations } from 'next-intl';
import Spinner from '../icons/spinner';
import { useToast } from './toast';
import { ServerActionResult } from '@shared/actions/server-action-result';
import { openInNewTab } from '@/utils/navigation/router';
import { Button } from '@ui/components/Button';

type DownloadFileButtonProps = {
  fileId: string;
  onDownloadFile: (fileId: string) => Promise<ServerActionResult<string | undefined>>;
};

export default function DownloadFileButton({ fileId, onDownloadFile }: DownloadFileButtonProps) {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const t = useTranslations('file-interaction');
  const toast = useToast();

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const result = await onDownloadFile(fileId);
      if (result.success && result.value) {
        openInNewTab(result.value);
      } else {
        toast.error(t('toasts.download-error'));
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon-round"
        className="text-primary"
        aria-label={t('download.aria-label')}
        onClick={handleDownload}
        disabled={isDownloading}
      >
        {isDownloading ? <Spinner className="size-5" /> : <DownloadSimpleIcon className="size-6" />}
      </Button>
    </>
  );
}
