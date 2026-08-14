import React from 'react';
import { getFileIconByFileExtension } from '../icons/file-upload-icons/file-icons-dict';
import DeattachFileIcon from '../icons/file-upload-icons/deattach-file-icon';
import Spinner from '../icons/spinner';
import CrossIcon from '../icons/cross';
import { getFileNameAndFileExtension, isImageFile } from '@/utils/files/generic';
import { LocalFileState } from './send-message-form';
import { cn } from '@/utils/tailwind';

type ChatInputAttachmentPreviewProps = {
  file: LocalFileState;
  onDeattachFile?: () => void;
  height?: 'default' | 'large';
  width?: 'default' | 'small';
};

export default function ChatInputAttachmentPreview({
  file,
  onDeattachFile,
  height = 'default',
  width = 'default',
}: ChatInputAttachmentPreviewProps) {
  const fileName = file.file.name;
  const [fileStem, fileExtension] = getFileNameAndFileExtension(fileName);
  const isImage = isImageFile(fileName);
  const [imageUrl, setImageUrl] = React.useState<string>();
  const { Icon: FileIcon, fillColor: backgroundColor } = getFileIconByFileExtension(fileExtension);
  React.useEffect(() => {
    if (!isImage) return;
    const objectUrl = URL.createObjectURL(file.file);
    const animationFrame = requestAnimationFrame(() => setImageUrl(objectUrl));
    return () => {
      cancelAnimationFrame(animationFrame);
      URL.revokeObjectURL(objectUrl);
    };
  }, [file, isImage]);
  if (isImage)
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
        <div className="relative flex items-center gap-2 h-14 w-14 overflow-hidden rounded-enterprise-sm">
          {file.status !== 'failed' && imageUrl !== undefined ? (
            <>
              <span className="sr-only">{fileName}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={fileName} className="w-full h-full object-cover" />
            </>
          ) : file.status === 'uploading' ? (
            <Spinner className="w-14 h-5" />
          ) : (
            <CrossIcon className="w-5 h-5" />
          )}
        </div>
      </div>
    );
  return (
    <div
      className={cn(
        'flex w-fit min-w-0 max-w-full shrink-0 items-center justify-start gap-2 pl-4 pr-6 text-sm relative group',
        height === 'large' ? 'py-0 h-14' : 'py-2',
      )}
    >
      <div className="absolute inset-0 opacity-5 rounded-lg" style={{ backgroundColor }} />
      {onDeattachFile !== undefined && (
        <button onClick={onDeattachFile} className="absolute right-0 top-0 hover:bg-neutral-200">
          <DeattachFileIcon />
        </button>
      )}
      <div
        className={cn(
          'relative flex items-center gap-2 min-w-0',
          height === 'large' ? 'h-14' : 'h-6',
        )}
      >
        {file.status === 'processed' && (
          <FileIcon className="h-5 w-5 shrink-0" color={backgroundColor} />
        )}
        {file.status === 'uploading' && <Spinner className="h-5 w-5 shrink-0" />}
        {file.status === 'failed' && <CrossIcon className="h-5 w-5 shrink-0" />}
        <div className={cn('flex min-w-0 flex-col', width === 'small' ? 'max-w-24' : 'max-w-80')}>
          <p className="truncate overflow-hidden text-sm" title={fileName}>
            {fileStem}
          </p>
        </div>
      </div>
    </div>
  );
}
