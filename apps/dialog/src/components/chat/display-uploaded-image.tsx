import React from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { FileModel } from '@/db/schema';
import { getSignedUrlFromS3Get } from '@/s3';
import { FileStatus } from './upload-file-button';
import DeattachFileIcon from '../icons/file-upload-icons/deattach-file-icon';
import Spinner from '../icons/spinner';
import CrossIcon from '../icons/cross';
import { EmptyImageIcon } from '../icons/empty-image';
import { cn } from '@/utils/tailwind';
import { useTranslations } from 'next-intl';

type DisplayUploadedImageProps = {
  file: FileModel;
  status: FileStatus;
  onDeattachFile?: () => void;
  showBanner?: boolean;
};

export default function DisplayUploadedImage({
  file,
  status,
  onDeattachFile,
  showBanner = true,
}: DisplayUploadedImageProps) {
  const t = useTranslations();
  const {
    data: imageUrl,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['signed-url', file.id, file.name, file.type],
    queryFn: async () => {
      const signedUrl = await getSignedUrlFromS3Get({
        key: `message_attachments/${file.id}`,
      });
      return signedUrl;
    },
    enabled: status === 'processed', // Only fetch when status is processed
    staleTime: 5 * 60 * 1000, // 5 minutes - signed URLs are typically valid for longer
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
  });

  if (status === 'uploading') {
    return (
      <div className="flex items-center justify-center gap-2 text-sm relative group py-4 pr-6 pl-4 shrink-0 max-w-[250px] min-w-[100px] bg-gray-50 rounded-lg">
        <Spinner className="w-5 h-5" />
        <span>Uploading image...</span>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm relative group py-4 pr-6 pl-4 shrink-0 max-w-[250px] min-w-[100px] bg-gray-50 rounded-lg">
        <EmptyImageIcon className={cn(`w-[200px]`, 'text-gray-300 animate-pulse')} />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm relative group py-4 pr-6 pl-4 shrink-0 max-w-[250px] min-w-[100px] bg-red-50 rounded-lg">
        <CrossIcon className="w-5 h-5 text-red-500" />
        <span className="text-red-700">{t('common.image-load-failed')}</span>
      </div>
    );
  }
  return (
    <div className="relative group max-w-xs rounded-lg overflow-hidden">
      {onDeattachFile !== undefined && (
        <button
          onClick={onDeattachFile}
          className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white rounded-full p-1 shadow-md hover:bg-gray-100"
          aria-label="Remove image"
        >
          <DeattachFileIcon />
        </button>
      )}
      <div className="relative">
        <Image
          src={imageUrl}
          alt={file.name}
          width={200}
          height={200}
          loading="eager"
          className="w-full h-auto max-h-48 object-cover rounded-enterprise-md"
          unoptimized={true} // Since we're using signed URLs from S3
        />
        {showBanner && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-enterprise-md">
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
