import DestructiveActionButton from '@/components/common/destructive-action-button';
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

type FilesTableProps = {
  files: FileModel[];
  additionalFiles: Map<string, LocalFileState>;
  onDeleteFile(fileId: string): Promise<void>;
  showUploadConfirmation?: boolean;
  className?: string;
  readOnly: boolean;
};

export default function FilesTable({
  files,
  onDeleteFile,
  additionalFiles,
  showUploadConfirmation,
  className,
  readOnly,
}: FilesTableProps) {
  const t = useTranslations('file-interaction');
  const toast = useToast();
  if (files.length < 1 && additionalFiles.size < 1) return null;

  function handleDeleteFile(file_id: string) {
    onDeleteFile(file_id).then(() => {
      if (showUploadConfirmation) toast.success(t('toasts.delete-from-form'));
    });
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
          id,
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
                    <span className="text-sm text-gray-500">Uploading...</span>
                  )}
                  {!readOnly && (
                    <DestructiveActionButton
                      modalDescription="Möchten Sie diese Datei wirklich dauerhaft löschen? Dieser Vorgang kann nicht rückgängig gemacht werden."
                      triggerButtonClassName={cn('flex items-center', iconClassName)}
                      modalTitle="Datei löschen"
                      confirmText="Datei löschen"
                      actionFn={() => handleDeleteFile(id)}
                    >
                      <TrashIcon className="w-9 h-9" />
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
