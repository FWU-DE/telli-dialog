import React from 'react';
import { cn } from '@/utils/tailwind';
import GenericFileUploadButton from '@/components/common/upload-file-button';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import UploadImageIcon from '../icons/upload-image';
import ImageCropModal from './crop-image-modal';
import { CompressionOptions } from '@/utils/files/image-utils';
import { saveFileAction } from './actions';

type UploadImageToBeCroppedButtonProps = {
  uploadDirPath: string;
  aspect: number;
  onUploadComplete: (imagePath: string) => void;
  compressionOptions?: CompressionOptions;
  file_prefix?: string;
  file_name?: string;
  securityOptions: { characterId: string };
};

export default function UploadImageToBeCroppedButton({
  aspect,
  onUploadComplete,
  compressionOptions,
  securityOptions,
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
    if (file === null) return;

    const formData = new FormData();
    formData.append('file', croppedBlob, file.name);

    if (securityOptions.characterId) {
      formData.append('characterId', securityOptions.characterId);
    }

    const imagePath = await saveFileAction(formData);

    // const signedUploadUrl = await getSignedUrlFromS3Put({
    //   key: imagePath,
    //   fileType: croppedBlob.type,
    // });
    //
    // const uploadResponse = await fetch(signedUploadUrl, {
    //   method: 'PUT',
    //   headers: {
    //     'Content-Type': croppedBlob.type,
    //   },
    //   body: croppedBlob,
    //   cache: 'no-cache',
    // });

    onUploadComplete(imagePath);
    setShowCropModal(false);
    setFile(null);
    setImageSource(null);
  }

  return (
    <div>
      <GenericFileUploadButton
        onSubmit={handleImageUpload}
        triggerButton={
          <>
            <UploadImageIcon className="group-hover:text-secondary-text" />
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
