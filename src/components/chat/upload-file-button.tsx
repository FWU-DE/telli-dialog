import { nanoid } from 'nanoid';
import React from 'react';
import { LocalFileState } from './send-message-form';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { ToastContextType, useToast } from '../common/toast';
import { useConversation } from '../providers/conversation-provider';
import AttachFileIcon from '../icons/attach-file';
import { cn } from '@/utils/tailwind';
import { SUPPORTED_FILE_EXTENSIONS, MAX_FILE_SIZE } from '@/const';
import { TranslationValues, useTranslations } from 'next-intl';
import { NUMBER_OF_FILES_LIMIT } from '@/configuration-text-inputs/const';

export type FileUploadMetadata = {
  directoryId: string;
};

export type FileUploadResponse = {
  fileId: string;
};

export type FileStatus = 'uploading' | 'processed' | 'failed' | 'success';

export type UploadFileButtonProps = {
  setFiles: React.Dispatch<React.SetStateAction<Map<string, LocalFileState>>>;
  disabled?: boolean;
  isPrivateMode?: boolean;
  onFileUploaded?: (data: { id: string; name: string; file: File }) => void;
  triggerButton?: React.ReactNode;
  fileUploadFn?: (file: File) => Promise<FileUploadResponse>;
  onFileUploadStart?: () => void;
  className?: string;
  directoryId?: string;
  showUploadConfirmation?: boolean;
  countOfFiles?: number;
  setFileUploading?: React.Dispatch<React.SetStateAction<boolean>>;
};

export async function handleSingleFile({
  file,
  setFiles,
  onFileUploaded,
  toast,
  translations,
  showUploadConfirmation,
}: {
  file: File;
  prevFileIds?: string[];
  setFiles: React.Dispatch<React.SetStateAction<Map<string, LocalFileState>>>;
  fileUploadFn?: (file: File) => Promise<FileUploadResponse>;
  directoryId?: string;
  onFileUploaded?: (data: { id: string; name: string; file: File }) => void;
  session: ReturnType<typeof useSession>;
  conversation?: ReturnType<typeof useConversation>;
  toast: ToastContextType;
  translations: (key: string, values?: TranslationValues) => string;
  showUploadConfirmation?: boolean;
}) {
  if (!file) {
    throw new Error('No files uploaded');
  }
  if (file.size > MAX_FILE_SIZE) {
    toast.error(
      translations('toasts.file-too-large', {
        file_name: file.name,
        max_file_size: MAX_FILE_SIZE / 1_000_000,
      }),
    );
    return;
  }
  const localId = nanoid();
  setFiles((prevFiles) => {
    const updatedFiles = new Map(prevFiles);
    updatedFiles.set(localId, {
      file,
      status: 'uploading',
      fileId: undefined,
    });
    return updatedFiles;
  });

  const blobFile = new Blob([file], { type: file.type });

  try {
    const fileId = await fetchUploadFile({
      body: blobFile,
      contentType: file.type,
      fileName: file.name,
    });
    setFiles((prevFiles) => {
      const updatedFiles = new Map(prevFiles);
      const fileState = updatedFiles.get(localId);
      if (fileState) {
        updatedFiles.set(localId, {
          ...fileState,
          status: 'processed',
          fileId,
        });
      }
      return updatedFiles;
    });
    onFileUploaded?.({ id: fileId, name: file.name, file });
    if (showUploadConfirmation) toast.success(translations('toasts.upload-success'));
  } catch (error) {
    setFiles((prevFiles) => {
      const updatedFiles = new Map(prevFiles);
      const fileState = updatedFiles.get(localId);
      if (fileState) {
        updatedFiles.set(localId, {
          ...fileState,
          status: 'failed',
        });
      }
      console.error(error);
      toast.error(translations('toasts.upload-error'));
      return updatedFiles;
    });
  }
}

export default function UploadFileButton({
  setFiles,
  disabled = false,
  isPrivateMode = false,
  onFileUploaded,
  triggerButton,
  fileUploadFn,
  className,
  onFileUploadStart,
  directoryId,
  setFileUploading,
}: UploadFileButtonProps) {
  const toast = useToast();
  const session = useSession();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const t = useTranslations('file-interaction');
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = event.target.files;

    if (selectedFiles === null) return;

    const files = Array.from(selectedFiles);
    setFileUploading?.(true);
    onFileUploadStart?.();
    await Promise.all(
      files.map((f) =>
        handleSingleFile({
          file: f,
          setFiles,
          fileUploadFn,
          directoryId,
          onFileUploaded,
          session,
          conversation,
          toast,
          translations: t,
        }),
      ),
    );
    setFileUploading?.(false);
    if (fileInputRef.current !== null) {
      fileInputRef.current.value = '';
    }
  }

  const conversation = useConversation();

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  return (
    <>
      <input
        hidden
        multiple
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={SUPPORTED_FILE_EXTENSIONS.map((e) => `.${e}`).join(',')}
      />
      <button
        onClick={handleUploadClick}
        className={className}
        disabled={disabled || isPrivateMode}
        type="button"
        title={
          disabled
            ? t('upload.file-limit-reached', { max_files: NUMBER_OF_FILES_LIMIT })
            : t('upload.upload-file-button')
        }
      >
        {triggerButton ?? (
          <AttachFileIcon
            className={cn('sm:w-10 sm:h-10 w-8 h-8')}
            stroke={isPrivateMode ? 'white' : 'black'}
          />
        )}
      </button>
    </>
  );
}

export async function fetchUploadFile(data: {
  body: Blob;
  contentType: string;
  fileName: string;
}): Promise<string> {
  const formData = new FormData();
  formData.append('file', data.body, data.fileName);
  const response = await fetch('/api/v1/upload-file', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    throw Error('Could not upload file');
  }

  const json = await response.json();
  const parsedJson = z.object({ file_id: z.string() }).parse(JSON.parse(json?.body));

  return parsedJson.file_id;
}
