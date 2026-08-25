import React from 'react';
import Image from 'next/image';
import { FileModel } from '@shared/db/schema';
import CrossIcon from '../icons/cross';
import { useTranslations } from 'next-intl';

// Extended type for pending files that includes a local blob URL
export type PendingFileModel = FileModel & { localUrl?: string };

type MessageImageAttachmentProps = {
  file: FileModel | PendingFileModel;
  width?: number;
  height?: number;
};

export default function MessageImageAttachment({
  file,
  width = 200,
  height = 200,
}: MessageImageAttachmentProps) {
  const t = useTranslations();

  // Check if file has a local URL (for pending files)
  const localUrl = 'localUrl' in file ? file.localUrl : undefined;
  const fetchedImageUrl = !localUrl
    ? `/api/files/${file.id}/scaled-image?width=${width}&height=${height}`
    : null;

  // Use local URL if available, otherwise use signed URL from S3
  const imageUrl = localUrl ?? fetchedImageUrl;

  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm relative group py-4 pr-6 pl-4 shrink-0 max-w-[250px] min-w-[100px] bg-red-50 rounded-lg">
        <CrossIcon className="w-5 h-5 text-red-500" />
        <span className="text-red-700">{t('common.image-load-failed')}</span>
      </div>
    );
  }

  return (
    <Image
      src={imageUrl}
      alt={file.name}
      width={width}
      height={height}
      loading="eager"
      className="max-w-xs h-auto max-h-48 object-cover rounded-enterprise-md"
      unoptimized // Since we're using signed URLs from S3
    />
  );
}
