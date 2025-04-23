import React, { useState, useRef, useCallback } from 'react';
import { FileUploadIcon } from '../icons/file-upload-icons/file-upload-tray-icon';
import { useTranslations } from 'next-intl';
import { cn } from '@/utils/tailwind';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { handleSingleFile, UploadFileButtonProps } from '../chat/upload-file-button';
import { useSession } from 'next-auth/react';
import { useToast } from '../common/toast';
import { SUPPORTED_FILE_EXTENSIONS } from '@/const';


export function FileDrop({ onFileUploaded, setFiles, disabled, showUploadConfirmation=false }: UploadFileButtonProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const session = useSession();

  const t = useTranslations('file-interaction');
    async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>){
        await handleFiles(event.target.files)
    }    

  async function handleFiles(selectedFiles: FileList | undefined | null) {
    if (selectedFiles == null) return;
    const files = Array.from(selectedFiles);
    await Promise.all(
      files.map((f) =>
        handleSingleFile({
          file: f,
          toast,
          session,
          setFiles,
          onFileUploaded,
          translations: t,
        }),
        toast.success(t('toasts.upload-success'))
      ),
    );

    if (fileInputRef.current !== null) {
      fileInputRef.current.value = '';
    }
  }

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

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const { files } = e.dataTransfer;
    handleFiles(files);
  }, []);

  const handleButtonClick = (): void => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`w-full`}>
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
          accept={SUPPORTED_FILE_EXTENSIONS.map((e) => `.${e}`).join(',')}
          multiple
        />
        <div className="mt-4 flex flex-col text-sm gap-4 items-center">
          <FileUploadIcon className="" />
          <span className="text-xl">{t('upload.drop-area')}</span>
          <span className="text-gray-600">{t('upload.choice-word')}</span>
          <button
            className={cn(buttonPrimaryClassName)}
            disabled={false}
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
