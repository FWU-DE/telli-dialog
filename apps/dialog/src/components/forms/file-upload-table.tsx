import DestructiveActionButton from '@/components/common/destructive-action-button';
import DownloadFileButton from '@/components/common/download-file-button';
import { FileModel } from '@shared/db/schema';
import React from 'react';

import { isNotNull } from '@shared/utils/guard';
import Spinner from '../icons/spinner';
import CrossIcon from '../icons/cross';
import { LocalFileState } from '../chat/send-message-form';
import { getFileIconByFileExtension } from '../icons/file-upload-icons/file-icons-dict';
import { formatBytes, getFileNameAndFileExtention, hexToRGBA } from '@/utils/files/generic';
import { FileStatus } from '../chat/upload-file-button';
import TrashIcon from '../icons/trash';
import { useToast } from '../common/toast';
import { useTranslations } from 'next-intl';
import { iconClassName } from '@/utils/tailwind/icon';
import { cn } from '@/utils/tailwind';
import { ServerActionResult } from '@shared/actions/server-action-result';

type FilesTableProps = {
  files: FileModel[];
  additionalFiles: Map<string, LocalFileState>;
  onDeleteFile(fileId: string): Promise<void>;
  className?: string;
  readOnly: boolean;
  onDownloadFile?: (fileId: string) => Promise<ServerActionResult<string | undefined>>;
};

export default function FilesTable({
  files,
  onDeleteFile,
  additionalFiles,
  className,
  readOnly,
  onDownloadFile,
}: FilesTableProps) {
  const t = useTranslations('file-interaction');
  const toast = useToast();
  if (files.length < 1 && additionalFiles.size < 1) return null;

  async function handleDeleteFile(fileId: string) {
    await onDeleteFile(fileId);
    toast.success(t('toasts.delete-from-form'));
  }

  const mergedFiles = [
    ...files.map((f) => ({
      id: f.id,
      size: f.size,
      fileName: f.name,
      status: 'processed' as const,
    })),
    ...Array.from(additionalFiles)
      .map(([id, fileObject]) => {
        if (fileObject.file.type === 'image') {
          return null;
        }
        return {
          id: fileObject.fileId ?? id,
          fileName: fileObject.file.name,
          size: fileObject.file.size,
          status: fileObject.status,
        };
      })
      .filter(isNotNull),
  ] satisfies {
    id: string | undefined;
    fileName: string;
    size: number;
    status: FileStatus;
  }[];
  return (
    <table className={cn('w-full', className)}>
      {/* <thead>
        <tr className="font-normal bg-light-gray w-full text-sm">
          <th className="font-medium text-left py-3 text-dark-gray pl-3">Name</th>
          <th className="font-medium text-left py-3 text-dark-gray">Dateigröße</th>
          <th className="font-medium text-center py-3 text-dark-gray min-w-20"></th>
        </tr>
      </thead> */}
      <tbody>
        {mergedFiles
          .filter(({ status }) => status !== 'failed')
          .map(({ id, fileName, size, status }) => {
            const [fileStem, extention] = getFileNameAndFileExtention(fileName);
            const { Icon, fillColor } = getFileIconByFileExtension(extention);

            return (
              <tr
                key={id}
                className="flex items-center justify-between gap-4 border-b last:border-b-0 border-[#D9D9D9] p-2"
              >
                <td className="flex gap-2 items-center flex-1">
                  {status === 'processed' && (
                    <Icon
                      className="w-9 h-9 p-1.5"
                      style={{ background: hexToRGBA(fillColor, 0.05) }}
                    />
                  )}
                  {status === 'uploading' && <Spinner className="w-9 h-9 p-1.5" />}
                  {status === 'failed' && <CrossIcon className="w-9 h-9 p-1.5 text-red-500" />}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{fileStem}</span>
                  </div>
                </td>
                <td className="flex items-center gap-4 ml-auto">
                  <span className="text-sm whitespace-nowrap">{formatBytes(size)}</span>
                  {status === 'uploading' && (
                    <span className="text-sm text-gray-500">{t('upload.uploading')}</span>
                  )}
                  {status === 'processed' && onDownloadFile && (
                    <DownloadFileButton fileId={id} onDownloadFile={onDownloadFile} />
                  )}
                  {status === 'processed' && !readOnly && (
                    <DestructiveActionButton
                      aria-label={t('delete.button')}
                      modalDescription={t('delete.modal-description')}
                      triggerButtonClassName={cn('flex items-center', iconClassName)}
                      modalTitle={t('delete.modal-title')}
                      confirmText={t('delete.confirm')}
                      actionFn={() => handleDeleteFile(id)}
                    >
                      <TrashIcon className="w-9 h-9" />
                      <span className="sr-only">{t('delete.button')}</span>
                    </DestructiveActionButton>
                  )}
                </td>
              </tr>
            );
          })}
      </tbody>
    </table>
  );
}
