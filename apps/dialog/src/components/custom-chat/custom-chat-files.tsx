import React from 'react';
import { FileModel } from '@shared/db/schema';
import { LocalFileState } from '../chat/send-message-form';
import FileDrop from '../forms/file-drop-area';
import { NUMBER_OF_FILES_LIMIT_FOR_SHARED_CHAT } from '@/configuration-text-inputs/const';
import FilesTable from '../forms/file-upload-table';
import { ServerActionResult } from '@shared/actions/server-action-result';

export type CustomChatFilesProps = {
  initialFiles: FileModel[];
  onFileUploaded: (data: {
    id: string;
    name: string;
    file: File;
  }) => Promise<ServerActionResult<void>>;
  onDeleteFile: (fileId: string) => Promise<ServerActionResult<void>>;
};

export function CustomChatFiles(props: CustomChatFilesProps) {
  const { initialFiles, onFileUploaded: onFileUploaded, onDeleteFile } = props;
  const [files, setFiles] = React.useState<Map<string, LocalFileState>>(new Map());
  const [currentFiles, setCurrentFiles] = React.useState<FileModel[]>(initialFiles);

  const handleDeleteFile = async (fileId: string) => {
    // It seems unnecessary to handle files and currentFiles separately.
    // This could be refactored in the future.
    const result = await onDeleteFile(fileId);
    if (result.success) {
      setFiles((prev) => {
        const newFiles = new Map(prev);
        newFiles.delete(fileId);
        return newFiles;
      });
      setCurrentFiles((prev) => prev.filter((f) => f.id !== fileId));
    }
  };

  return (
    <>
      <FileDrop
        setFiles={setFiles}
        disabled={initialFiles.length + files.size >= NUMBER_OF_FILES_LIMIT_FOR_SHARED_CHAT}
        countOfFiles={initialFiles.length + files.size}
        onFileUploaded={onFileUploaded}
        showUploadConfirmation={true}
      />
      <FilesTable
        files={currentFiles}
        additionalFiles={files}
        onDeleteFile={handleDeleteFile}
        showUploadConfirmation={true}
        readOnly={false}
      />
    </>
  );
}
