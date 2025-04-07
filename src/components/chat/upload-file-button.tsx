import { nanoid } from 'nanoid';
import React from 'react';
import { LocalFileState } from './send-message-form';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { ToastContextType, useToast } from '../common/toast';
import { useConversation } from '../providers/conversation-provider';
import AttachFileIcon from '../icons/attach-file';
import { cn } from '@/utils/tailwind';

export type FileUploadMetadata = {
  directoryId: string;
};

export type FileStatus = 'uploading' | 'processed' | 'failed';

type UploadFileButtonProps = {
  setFiles: React.Dispatch<React.SetStateAction<Map<string, LocalFileState>>>;
  disabled?: boolean;
  prevFileIds?: string[];
  isPrivateMode?: boolean;
  onFileUploaded?: (data: { id: string; name: string; file: File }) => void;
  triggerButton?: React.ReactNode;
  fileUploadFn?: (file: File) => Promise<string>;
  onFileUploadStart?: () => void;
  className?: string;
  directoryId?: string;
};

const SUPPORTED_FILE_EXTENSIONS = [
  'docx',
  'doc',
  'rtf',
  'xlsx',
  'xls',
  'csv',
  'pptx',
  'ppt',
  'pdf',
  'md',
  'txt',
  'html',
];

const MAX_FILE_SIZE = 20_000_000; // 10MB
export async function handleSingleFile({
  file,
  prevFileIds,
  setFiles,
  fileUploadFn,
  directoryId,
  onFileUploaded,
  session,
  conversation,
  toast,
}: {
  file: File;
  prevFileIds?: string[];
  setFiles: React.Dispatch<React.SetStateAction<Map<string, LocalFileState>>>;
  fileUploadFn?: (file: File) => Promise<string>;
  directoryId?: string;
  onFileUploaded?: (data: { id: string; name: string; file: File }) => void;
  session: ReturnType<typeof useSession>;
  conversation: ReturnType<typeof useConversation>;
  toast: ToastContextType;
}) {
  if (!file) {
    throw new Error('No files uploaded');
  }

  if (file.size > MAX_FILE_SIZE) {
    toast.error(
      `Die Datei '${file.name}' ist zu groß. Das Limit liegt bei ${MAX_FILE_SIZE / 1_000_000} MB.`,
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
    const fileId =
      fileUploadFn !== undefined
        ? await fileUploadFn(file)
        : await fetchUploadFile({
            body: blobFile,
            contentType: file.type,
            fileName: file.name,
            prevFileIds: prevFileIds,
            directoryId: directoryId,
          });
    console.log(fileId);
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
      toast.error(
        'Die Datei konnte leider nicht hochgeladen werden. Bitte versuchen Sie es erneut',
      );
      return updatedFiles;
    });
  }
}

export default function UploadFileButton({
  setFiles,
  prevFileIds,
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

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = event.target.files;

    if (selectedFiles === null) return;

    const files = Array.from(selectedFiles);

    onFileUploadStart?.();
    await Promise.all(
      files.map((f) =>
        handleSingleFile({
          file: f,
          prevFileIds,
          setFiles,
          fileUploadFn,
          directoryId,
          onFileUploaded,
          session,
          conversation,
          toast,
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
        title={'Dateien hochladen'}
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
  prevFileIds?: string[];
  directoryId?: string;
}) {
  console.log('REQUESTING');
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
