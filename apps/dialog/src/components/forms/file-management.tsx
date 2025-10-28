'use client';

import { LocalFileState } from '@/components/chat/send-message-form';
import { useToast } from '@/components/common/toast';
import FileDrop from '@/components/forms/file-drop-area';
import FilesTable from '@/components/forms/file-upload-table';
import { FileModel } from '@/db/schema';
import { cn } from '@/utils/tailwind';
import { labelClassName } from '@/utils/tailwind/input';
import { useTranslations } from 'next-intl';
import React from 'react';

interface FileManagementProps {
  files: Map<string, LocalFileState>;
  setFiles: React.Dispatch<React.SetStateAction<Map<string, LocalFileState>>>;
  initialFiles: FileModel[];
  onFileUploaded: (data: { id: string; name: string; file: File }) => void;
  onDeleteFile: (localFileId: string) => Promise<void>;
  readOnly: boolean;
  translationNamespace?: Parameters<typeof useTranslations>[0];
}

export default function FileManagement({
  files,
  setFiles,
  initialFiles,
  onFileUploaded,
  onDeleteFile,
  readOnly,
  translationNamespace,
}: FileManagementProps) {
  const toast = useToast();
  const t = useTranslations(translationNamespace);

  if (readOnly) {
    return null;
  }

  return (
    <>
      <label className={cn(labelClassName)}>{t('attached-files-label')}</label>
      <FileDrop
        setFiles={setFiles}
        countOfFiles={initialFiles.length + files.size}
        onFileUploaded={onFileUploaded}
        showUploadConfirmation={true}
      />
      <FilesTable
        files={initialFiles ?? []}
        additionalFiles={files}
        onDeleteFile={onDeleteFile}
        toast={toast}
        showUploadConfirmation={true}
      />
    </>
  );
}
