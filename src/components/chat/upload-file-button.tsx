import { nanoid } from 'nanoid';
import React from 'react';
import { LocalFileState } from './send-message-form';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { ToastContextType, useToast } from '../common/toast';
import { useConversation } from '../providers/conversation-provider';
import AttachFileIcon from '../icons/attach-file';
import { cn } from '@/utils/tailwind';
import { SUPPORTED_FILE_EXTENSIONS } from '@/const';
import { TranslationValues, useTranslations } from 'next-intl';

export type FileUploadMetadata = {
  directoryId: string;
};

export type FileUploadResponseWithWarning = {
  fileId: string;
  warning: string | null;
};

export type FileStatus = 'uploading' | 'processed' | 'failed' | 'success';

export type UploadFileButtonProps = {
  setFiles: React.Dispatch<React.SetStateAction<Map<string, LocalFileState>>>;
  disabled?: boolean;
  isPrivateMode?: boolean;
  onFileUploaded?: (data: { id: string; name: string; file: File }) => void;
  triggerButton?: React.ReactNode;
  fileUploadFn?: (file: File) => Promise<FileUploadResponseWithWarning>;
  onFileUploadStart?: () => void;
  className?: string;
  directoryId?: string;
  showUploadConfirmation?: boolean;
};

const MAX_FILE_SIZE = 5_000_000; // 5MB
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
  fileUploadFn?: (file: File) => Promise<FileUploadResponseWithWarning>;
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
    const fileIdAndWarning = await fetchUploadFile({
      body: blobFile,
      contentType: file.type,
      fileName: file.name,
    });
    const fileId = fileIdAndWarning.fileId;
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
    if (fileIdAndWarning.warning !== null) {
      toast.error(fileIdAndWarning.warning);
    }
    onFileUploaded?.({ id: fileIdAndWarning.fileId, name: file.name, file });
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
}: UploadFileButtonProps) {
  const toast = useToast();
  const session = useSession();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const t = useTranslations('file-interaction');
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = event.target.files;

    if (selectedFiles === null) return;

    const files = Array.from(selectedFiles);

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
        title={disabled ? t('upload.file-limit-reached') : t('upload.upload-file-button')}
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
}): Promise<FileUploadResponseWithWarning> {
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
  const parsedJson = z
    .object({ file_id: z.string(), warning: z.string().nullable() })
    .parse(JSON.parse(json?.body));

  return { fileId: parsedJson.file_id, warning: parsedJson.warning };
}
