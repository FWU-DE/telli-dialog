import React from 'react';
import Image from 'next/image';
import { FileStatus } from './upload-file-button';

import ParagraphWithConditionalTitle from './paragraph-with-conditional-title';
import { getFileIconByFileExtension } from '../icons/file-upload-icons/file-icons-dict';
import DeattachFileIcon from '../icons/file-upload-icons/deattach-file-icon';
import Spinner from '../icons/spinner';
import CrossIcon from '../icons/cross';
import { getFileExtension, isImageFile } from '@/utils/files/generic';
import { getReadOnlySignedUrlAction } from '@/app/api/file-operations/actions';
import { useQuery } from '@tanstack/react-query';
import { LocalFileState } from './send-message-form';

type DisplayUploadedFileProps = {
  fileName: string;
  status: FileStatus;
  file?: LocalFileState;
  onDeattachFile?: () => void;
  getSignedUrl?: (fileId: string) => Promise<string>;
};

export default function DisplayUploadedFile({
  fileName,
  status,
  file,
  onDeattachFile,
  getSignedUrl,
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

      if (getSignedUrl !== undefined && file.fileId !== undefined) {
        return getSignedUrl(file.fileId);
      }

      const signedUrl = await getReadOnlySignedUrlAction({
        key: `message_attachments/${file.fileId}`,
      });
      return signedUrl;
    },
    enabled: status === 'processed' && file?.fileId !== undefined, // Only fetch when status is processed and a fileId exists
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
        <div className="relative flex h-14 w-14 items-center gap-2 overflow-hidden rounded-enterprise-sm">
          {status === 'processed' && !isLoading && !!imageUrl ? (
            <Image
              src={imageUrl}
              alt={fileName}
              width={200}
              height={200}
              loading="eager"
              className="w-full h-full object-cover"
              unoptimized // Since we're using signed URLs from S3
            />
          ) : status === 'uploading' || isLoading ? (
            <Spinner className="h-5 w-14" />
          ) : (
            <CrossIcon className="w-5 h-5" />
          )}
        </div>
      </div>
    );
  }

  // TODO: this shoulld only be a button if the fileId is present and otherwise just a div

  return (
    <div className="group relative flex w-fit max-w-40 min-w-0 shrink-0 items-center justify-start gap-2 py-4 pl-4 pr-6 text-sm">
      <div className="absolute inset-0 opacity-5" style={{ backgroundColor }} />
      {onDeattachFile !== undefined && (
        <button onClick={onDeattachFile} className="absolute right-0 top-0 hover:bg-neutral-200">
          <DeattachFileIcon />
        </button>
      )}
      <div className="relative flex h-6 min-w-0 items-center gap-2">
        {status === 'processed' && <FileIcon className="h-8 w-8 shrink-0" />}
        {status === 'uploading' && <Spinner className="h-5 w-5 shrink-0" />}
        {status === 'failed' && <CrossIcon className="h-5 w-5 shrink-0" />}
        <div className="flex min-w-0 flex-col">
          <ParagraphWithConditionalTitle content={fileName} />
          <span className="text-left text-[10px] font-normal text-gray-100">
            {`.${getFileExtension(fileName)}`}
          </span>
        </div>
      </div>
    </div>
  );
}
