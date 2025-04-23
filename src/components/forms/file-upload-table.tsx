import DestructiveActionButton from '@/components/common/destructive-action-button';
import { FileModel, FileModelAndUrl } from '@/db/schema';
import React from 'react';

import { isNotNull } from '@/utils/guard';
import Spinner from '../icons/spinner';
import CrossIcon from '../icons/cross';
import { LocalFileState } from '../chat/send-message-form';
import { getFileIconByFileExtension } from '../icons/file-upload-icons/file-icons-dict';
import {
  formatBytes,
  getFileExtension,
  getFileNameAndFileExtention,
  hexToRGBA,
} from '@/utils/files/generic';
import { FileStatus } from '../chat/upload-file-button';
import TrashIcon from '../icons/trash';
import { ToastContextType } from '../common/toast';
import { useTranslations } from 'next-intl';

type FilesTableProps = {
  files: FileModel[];
  additionalFiles: Map<string, LocalFileState>;
  onDeleteFile(fileId: string): Promise<void>;
  toast: ToastContextType;
  showUploadConfirmation?: boolean;
  className?: string
};

export default function FilesTable({
  files,
  onDeleteFile,
  additionalFiles,
  showUploadConfirmation,
  toast,
  className
}: FilesTableProps) {
  if (files.length < 1 && additionalFiles.size < 1) return null;

  const t = useTranslations('file-interaction');

  function handleDeleteFile(file_id: string) {
    onDeleteFile(file_id).then(() => {
      if (showUploadConfirmation) toast.success(t('toasts.delete-from-form'));
    });
  }
  console.log(additionalFiles);
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
        if (fileObject.fileId == null) return null;
        // filter all duplicate files
        if (
          fileObject.status === 'success' &&
          fileObject.file.type === 'file' &&
          files.map((f) => f.id).includes(fileObject.fileId)
        ) {
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
    
      <table className={className}>
        {/* <thead>
        <tr className="font-normal bg-light-gray w-full text-sm">
          <th className="font-medium text-left py-3 text-dark-gray pl-3">Name</th>
          <th className="font-medium text-left py-3 text-dark-gray">Dateigröße</th>
          <th className="font-medium text-center py-3 text-dark-gray min-w-[5rem]"></th>
        </tr>
      </thead> */}
        <tbody>
          {mergedFiles.map(({ id, fileName, size, status }) => {
            const [fileStem, extention] = getFileNameAndFileExtention(fileName);
            const { Icon, fillColor } = getFileIconByFileExtension(extention);

            return (
              <tr key={id} className="border-b-[1px] last:border-b-0 border-[#D9D9D9]">
                <td className="flex gap-2 items-center p-2">
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
                    <span className="text-gray-600 text-xs">.{extention}</span>
                  </div>
                </td>
                <td>{formatBytes(size)}</td>
                <td className='w-8'>
                  <DestructiveActionButton
                    modalDescription="Möchten Sie diese Datei wirklich dauerhaft löschen? Dieser Vorgang kann nicht rückgängig gemacht werden."
                    triggerButtonClassName="flex items-center border-none w-full justify-center hover:bg-transparent"
                    modalTitle="Datei löschen"
                    confirmText="Datei löschen"
                    actionFn={() => handleDeleteFile(id)}
                  >
                    <TrashIcon />
                  </DestructiveActionButton>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
  );
}
