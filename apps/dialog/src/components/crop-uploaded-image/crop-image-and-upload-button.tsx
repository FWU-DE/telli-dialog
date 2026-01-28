'use client';

import React from 'react';
import { cn } from '@/utils/tailwind';
import GenericFileUploadButton from '@/components/common/upload-file-button';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import UploadImageIcon from '../icons/upload-image';
import ImageCropModal from './crop-image-modal';
import { CompressionOptions } from '@/utils/files/image-utils';
import { useToast } from '../common/toast';
import { useTranslations } from 'next-intl';
import { ServerActionResult } from '@shared/actions/server-action-result';

type CropImageAndUploadButtonProps = {
  aspect: number;
  handleUploadAvatarPicture: (croppedImageBlob: Blob) => Promise<ServerActionResult<string>>;
  onUploadComplete: (imagePath: string) => void;
  compressionOptions?: CompressionOptions;
  disabled?: boolean;
};

export default function CropImageAndUploadButton({
  aspect,
  handleUploadAvatarPicture,
  onUploadComplete,
  compressionOptions,
  disabled = false,
}: CropImageAndUploadButtonProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [imageSource, setImageSource] = React.useState<string | null>(null);
  const [showCropModal, setShowCropModal] = React.useState<boolean>(false);
  const toast = useToast();
  const t = useTranslations('file-interaction');

  async function handleImageUpload(files: FileList) {
    const firstFile = files[0];
    if (!firstFile) return;
    setFile(firstFile);

    const reader = new FileReader();
    reader.onload = () => {
      setImageSource(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(firstFile);
  }

  async function handleCroppedImage(croppedBlob: Blob) {
    if (!croppedBlob || !file) return;

    const result = await handleUploadAvatarPicture(croppedBlob);

    if (result.success && result.value) {
      onUploadComplete(result.value);
      setShowCropModal(false);
    } else {
      toast.error(t('toasts.upload-error'));
      setShowCropModal(false);
    }
    setFile(null);
    setImageSource(null);
  }

  return (
    <div>
      <GenericFileUploadButton
        onSubmit={handleImageUpload}
        disabled={disabled}
        triggerButton={
          <>
            <UploadImageIcon className="group-hover:text-secondary-text w-4 h-4" />
            <span>Bild hochladen</span>
          </>
        }
        triggerClassName={cn(
          buttonPrimaryClassName,
          'flex items-center gap-2 mt-6 group w-full justify-center',
        )}
      />
      {showCropModal && imageSource && (
        <ImageCropModal
          imageSrc={imageSource}
          aspect={aspect}
          onClose={() => {
            setShowCropModal(false);
            setFile(null);
            setImageSource(null);
          }}
          onCropComplete={handleCroppedImage}
          compressionOptions={compressionOptions}
        />
      )}
    </div>
  );
}
