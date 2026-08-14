import React from 'react';
import Image from 'next/image';
import { FileModel } from '@shared/db/schema';
import { FileStatus } from './upload-file-button';
import DeattachFileIcon from '../icons/file-upload-icons/deattach-file-icon';
import Spinner from '../icons/spinner';
import CrossIcon from '../icons/cross';
import { useTranslations } from 'next-intl';

// Extended type for pending files that includes a local blob URL
export type PendingFileModel = FileModel & { localUrl?: string };

type MessageImageAttachmentProps = {
  file: FileModel | PendingFileModel;
  status: FileStatus;
  onDeattachFile?: () => void;
  showBanner?: boolean;
};

export default function MessageImageAttachment({
  file,
  status,
  onDeattachFile,
  showBanner = true,
}: MessageImageAttachmentProps) {
  const t = useTranslations();

  // Check if file has a local URL (for pending files)
  const localUrl = 'localUrl' in file ? file.localUrl : undefined;
  const fetchedImageUrl =
    status === 'processed' && !localUrl
      ? `/api/files/${file.id}/scaled-image?width=200&height=200`
      : null;

  // Use local URL if available, otherwise use signed URL from S3
  const imageUrl = localUrl ?? fetchedImageUrl;

  if (status === 'uploading') {
    return (
      <div className="flex items-center justify-center gap-2 text-sm relative group py-4 pr-6 pl-4 shrink-0 max-w-[250px] min-w-[100px] bg-gray-50 rounded-lg">
        <Spinner className="w-5 h-5" />
        <span>Uploading image...</span>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm relative group py-4 pr-6 pl-4 shrink-0 max-w-[250px] min-w-[100px] bg-red-50 rounded-lg">
        <CrossIcon className="w-5 h-5 text-red-500" />
        <span className="text-red-700">{t('common.image-load-failed')}</span>
      </div>
    );
  }
  return (
    <div className="relative group w-48 max-w-xs rounded-lg overflow-hidden">
      {onDeattachFile !== undefined && (
        <button
          onClick={onDeattachFile}
          className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
          aria-label="Remove image"
        >
          <DeattachFileIcon />
        </button>
      )}
      <div className="relative bg-gray-50">
        <Image
          src={imageUrl}
          alt={file.name}
          width={200}
          height={200}
          loading="eager"
          className="w-full h-48 object-contain rounded-enterprise-md"
          unoptimized // Since we're using signed URLs from S3
        />
        {showBanner && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 rounded-enterprise-md">
            <p className="truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-gray-300">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
        )}
      </div>
    </div>
  );
}
