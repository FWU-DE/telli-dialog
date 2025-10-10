import React, { useState, useRef, useCallback } from 'react';
import { FileUploadIcon } from '../icons/file-upload-icons/file-upload-tray-icon';
import { useTranslations } from 'next-intl';
import { cn } from '@/utils/tailwind';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { handleSingleFile, UploadFileButtonProps } from '../chat/upload-file-button';
import { useSession } from 'next-auth/react';
import { useToast } from '../common/toast';
import { SUPPORTED_DOCUMENTS_EXTENSIONS } from '@/const';
import { validateFileExtentsion as validateFileExtension } from '@/utils/files/generic';
import { FORM_NUMBER_FILES_LIMIT } from '@/configuration-text-inputs/const';

export function FileDrop({
  onFileUploaded,
  setFiles,
  disabled,
  showUploadConfirmation = false,
  countOfFiles,
  ...restProps
}: UploadFileButtonProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const session = useSession();

  const t = useTranslations('file-interaction');

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    await handleFiles(event.target.files);
  }

  function validateFileExtensions(selectedFiles: FileList | undefined | null) {
    if (selectedFiles === null || selectedFiles === undefined) return;
    const files = Array.from(selectedFiles);
    return files.some((f) => validateFileExtension(f.name));
  }

  const handleFiles = useCallback(
    async (selectedFiles: FileList | undefined | null) => {
      if (selectedFiles === null || selectedFiles === undefined) return;
      const files = Array.from(selectedFiles);

      const totalFileCount = countOfFiles ? countOfFiles + files.length : files.length;

      if (totalFileCount > FORM_NUMBER_FILES_LIMIT) {
        toast.error(
          t('toasts.file-limit-exceeded', {
            max_files: FORM_NUMBER_FILES_LIMIT,
          }),
        );
        return;
      }

      await Promise.all(
        files.map((f) =>
          handleSingleFile({
            file: f,
            toast,
            session,
            setFiles,
            onFileUploaded,
            translations: t,
            showUploadConfirmation,
          }),
        ),
      );

      if (fileInputRef.current !== null) {
        fileInputRef.current.value = '';
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [toast, session, setFiles, onFileUploaded, t, showUploadConfirmation],
  );

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDragging) {
        setIsDragging(true);
      }
    },
    [isDragging],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>): void => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const { files } = e.dataTransfer;
      if (!validateFileExtensions(files)) {
        toast.error(
          t('toasts.invalid-file-format', {
            supported_formats: SUPPORTED_DOCUMENTS_EXTENSIONS.join(','),
          }),
        );
        return;
      }
      handleFiles(files);
    },
    [handleFiles, t, toast],
  );

  const handleButtonClick = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div {...restProps}>
      <div
        className={`border-2 border-dashed rounded-enterprise-sm p-6 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        tabIndex={0}
        aria-label="File Drop Area"
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept={SUPPORTED_DOCUMENTS_EXTENSIONS.map((e) => `.${e}`).join(',')}
          multiple
        />
        <div className="mt-4 flex flex-col text-sm gap-4 items-center">
          <FileUploadIcon className="w-8 h-8 text-primary" />
          <span className="text-xl">{t('upload.drop-area')}</span>
          <span className="text-gray-600">{t('upload.choice-word')}</span>
          <button
            className={cn(buttonPrimaryClassName)}
            disabled={disabled}
            onClick={handleButtonClick}
            type="button"
          >
            {t('upload.upload-file-button')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FileDrop;
