import React from 'react';
import { FileModel } from '@shared/db/schema';
import { LocalFileState } from '../chat/send-message-form';
import FileDrop from '../forms/file-drop-area';
import { NUMBER_OF_FILES_LIMIT_FOR_SHARED_CHAT } from '@/configuration-text-inputs/const';
import FilesTable from '../forms/file-upload-table';
import { ServerActionResult } from '@shared/actions/server-action-result';
import { useToast } from '../common/toast';
import { useTranslations } from 'next-intl';

export type CustomChatFilesProps = {
  initialFiles: FileModel[];
  onFileUploaded?: (data: { id: string; name: string; file: File }) => void | Promise<void>;
  onDeleteFile?: (fileId: string) => Promise<ServerActionResult<void>>;
  onDownloadFile?: (fileId: string) => Promise<ServerActionResult<string | undefined>>;
};

export function CustomChatFiles(props: CustomChatFilesProps) {
  const { initialFiles, onFileUploaded: onFileUploaded, onDeleteFile, onDownloadFile } = props;
  const [additionalFiles, setAdditionalFiles] = React.useState(new Map<string, LocalFileState>());
  const [currentFiles, setCurrentFiles] = React.useState<FileModel[]>(initialFiles);
  const toast = useToast();
  const t = useTranslations('assistants');

  const handleDeleteFile = async (localFileId: string) => {
    if (!onDeleteFile) return;

    const fileId =
      [...additionalFiles.values()].find((f) => f.fileId === localFileId)?.fileId ??
      currentFiles.find((f) => f.id === localFileId)?.id;
    if (fileId === undefined) return;

    const result = await onDeleteFile(fileId);
    if (result.success) {
      setAdditionalFiles(
        (prev) =>
          new Map(
            [...prev.entries()].filter(([k, f]) => k !== localFileId && f.fileId !== localFileId),
          ),
      );
      setCurrentFiles((prev) => prev.filter((f) => f.id !== fileId));
    } else {
      toast.error(t('toasts.custom-file-delete-error'));
    }
  };

  return (
    <>
      {onFileUploaded && (
        <FileDrop
          setFiles={setAdditionalFiles}
          disabled={
            currentFiles.length + additionalFiles.size >= NUMBER_OF_FILES_LIMIT_FOR_SHARED_CHAT
          }
          countOfFiles={currentFiles.length + additionalFiles.size}
          onFileUploaded={onFileUploaded}
          showUploadConfirmation={true}
        />
      )}
      <FilesTable
        files={currentFiles}
        additionalFiles={additionalFiles}
        onDeleteFile={handleDeleteFile}
        showUploadConfirmation={true}
        readOnly={!onDeleteFile}
        onDownloadFile={onDownloadFile}
      />
    </>
  );
}
