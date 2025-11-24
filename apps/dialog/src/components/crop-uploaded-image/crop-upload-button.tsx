import React from 'react';
import { cn } from '@/utils/tailwind';
import GenericFileUploadButton from '@/components/common/upload-file-button';
import { getSignedUrlFromS3Put } from '@shared/s3';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import UploadImageIcon from '../icons/upload-image';
import ImageCropModal from './crop-image-modal';
import { CompressionOptions } from '@/utils/files/image-utils';
import { cnanoid } from '@telli/shared/random/randomService';

type UploadImageToBeCroppedButtonProps = {
  uploadDirPath: string;
  aspect: number;
  onUploadComplete: (imagePath: string) => void;
  compressionOptions?: CompressionOptions;
  file_prefix?: string;
  file_name?: string;
  disabled?: boolean;
};

export default function UploadImageToBeCroppedButton({
  uploadDirPath,
  aspect,
  onUploadComplete,
  compressionOptions,
  file_prefix,
  file_name,
  disabled = false,
}: UploadImageToBeCroppedButtonProps) {
  const [file, setFile] = React.useState<File | null>(null);
  const [imageSource, setImageSource] = React.useState<string | null>(null);
  const [showCropModal, setShowCropModal] = React.useState<boolean>(false);

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

    const fileName = file_name ?? `${file_prefix ?? ''}${cnanoid()}_${file.name}`;

    const imagePath = `${uploadDirPath}/${fileName}`;

    const signedUploadUrl = await getSignedUrlFromS3Put({
      key: imagePath,
      fileType: croppedBlob.type,
    });

    const uploadResponse = await fetch(signedUploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': croppedBlob.type,
      },
      body: croppedBlob,
      cache: 'no-cache',
    });

    if (uploadResponse.ok) {
      onUploadComplete(imagePath);
      setShowCropModal(false);
      setFile(null);
      setImageSource(null);
    } else {
      console.error('Upload failed');
    }
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
