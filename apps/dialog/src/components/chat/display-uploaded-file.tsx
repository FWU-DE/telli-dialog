import React from 'react';
import Image from 'next/image';
import { FileStatus } from './upload-file-button';

import ParagraphWithConditionalTitle from './paragraph-with-conditional-title';
import { getFileIconByFileExtension } from '../icons/file-upload-icons/file-icons-dict';
import DeattachFileIcon from '../icons/file-upload-icons/deattach-file-icon';
import Spinner from '../icons/spinner';
import CrossIcon from '../icons/cross';
import { getFileExtension, isImageFile } from '@/utils/files/generic';
import { getSignedUrlFromS3Get } from '@shared/s3';
import { useQuery } from '@tanstack/react-query';
import { LocalFileState } from './send-message-form';

type DisplayUploadedFileProps = {
  fileName: string;
  status: FileStatus;
  file?: LocalFileState;
  onDeattachFile?: () => void;
};

export default function DisplayUploadedFile({
  fileName,
  status,
  file,
  onDeattachFile,
}: DisplayUploadedFileProps) {
  const file_extension = getFileExtension(fileName);
  const isImage = isImageFile(fileName);

  const { Icon: FileIcon, fillColor: backgroundColor } = getFileIconByFileExtension(file_extension);

  const { data: imageUrl, isLoading } = useQuery({
    queryKey: file
      ? ['signed-url', file.fileId, file.file.name, file.file.type]
      : ['signed-url', null, null, null],
    queryFn: async () => {
      if (!file) {
        throw new Error('File is undefined');
      }
      const signedUrl = await getSignedUrlFromS3Get({
        key: `message_attachments/${file.fileId}`,
      });
      return signedUrl;
    },
    enabled: status === 'processed', // Only fetch when status is processed
    staleTime: 5 * 60 * 1000, // 5 minutes - signed URLs are typically valid for longer
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection time
  });
  if (isImage && file) {
    return (
      <div className="flex items-center justify-center text-sm relative group">
        <div
          className="absolute inset-0 opacity-5 rounded-enterprise-sm"
          style={{ backgroundColor }}
        />
        {onDeattachFile !== undefined && (
          <button
            onClick={onDeattachFile}
            className="absolute right-0 top-0 bg-neutral-50 z-10 rounded-enterprise-tr-sm"
          >
            <DeattachFileIcon />
          </button>
        )}
        <div className="relative flex items-center gap-2 h-[56px] w-[56px] overflow-hidden rounded-enterprise-sm">
          {status === 'processed' && !isLoading && !!imageUrl ? (
            <Image
              src={imageUrl}
              alt={fileName}
              width={200}
              height={200}
              loading="eager"
              className="w-full h-full object-cover"
              unoptimized={true} // Since we're using signed URLs from S3
            />
          ) : status === 'uploading' || isLoading ? (
            <Spinner className="w-[56px] h-5" />
          ) : (
            <CrossIcon className="w-5 h-5" />
          )}
        </div>
      </div>
    );
  }

  // TODO: this shoulld only be a button if the fileId is present and otherwise just a div

  return (
    <div className="flex items-center justify-left gap-2 text-sm relative group py-4 pr-6 pl-4 shrink-0 max-w-[250px] min-w-[100px]">
      <div className="absolute inset-0 opacity-5" style={{ backgroundColor }} />
      {onDeattachFile !== undefined && (
        <button onClick={onDeattachFile} className="absolute right-0 top-0 hover:bg-neutral-200">
          <DeattachFileIcon />
        </button>
      )}
      <div className="relative flex items-center gap-2 h-[24px]">
        {status === 'processed' && <FileIcon className="w-8 h-8" />}
        {status === 'uploading' && <Spinner className="w-5 h-5" />}
        {status === 'failed' && <CrossIcon className="w-5 h-5" />}
        <div className="flex flex-col">
          <ParagraphWithConditionalTitle content={fileName} />
          <span className="text-left text-gray-100 font-normal text-[10px]">{`.${getFileExtension(fileName)}`}</span>
        </div>
      </div>
    </div>
  );
}
