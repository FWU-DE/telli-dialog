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
};

export function CustomChatFiles(props: CustomChatFilesProps) {
  const { initialFiles, onFileUploaded: onFileUploaded, onDeleteFile } = props;
  const [files, setFiles] = React.useState<Map<string, LocalFileState>>(new Map());
  const [currentFiles, setCurrentFiles] = React.useState<FileModel[]>(initialFiles);
  const toast = useToast();
  const t = useTranslations('custom-chat.files-and-links');

  const handleDeleteFile = async (localFileId: string) => {
    if (!onDeleteFile) return;

    const fileId =
      files.get(localFileId)?.fileId ?? currentFiles.find((f) => f.id === localFileId)?.id;
    if (fileId === undefined) return;

    const result = await onDeleteFile(fileId);
    if (result.success) {
      setFiles((prev) => {
        const newFiles = new Map(prev);
        newFiles.delete(localFileId);
        return newFiles;
      });
      setCurrentFiles((prev) => prev.filter((f) => f.id !== fileId));
    } else {
      toast.error(t('file-delete-error'));
    }
  };

  return (
    <>
      {onFileUploaded && (
        <FileDrop
          setFiles={setFiles}
          disabled={currentFiles.length + files.size >= NUMBER_OF_FILES_LIMIT_FOR_SHARED_CHAT}
          countOfFiles={currentFiles.length + files.size}
          onFileUploaded={onFileUploaded}
          showUploadConfirmation={true}
        />
      )}
      <FilesTable
        files={currentFiles}
        additionalFiles={files}
        onDeleteFile={handleDeleteFile}
        showUploadConfirmation={true}
        readOnly={!onDeleteFile}
      />
    </>
  );
}
