import React from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { buttonPrimaryClassName, buttonSecondaryClassName } from '@/utils/tailwind/button';
import Image from 'next/image';
import { CompressionOptions, getCroppedImageBlob } from '@/utils/files/image-utils';
import { logError } from '@shared/logging';

type ImageCropModalProps = {
  imageSrc: string;
  aspect: number;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
  compressionOptions?: CompressionOptions;
};

export default function ImageCropModal({
  imageSrc,
  aspect,
  onClose,
  onCropComplete,
  compressionOptions,
}: ImageCropModalProps) {
  const [crop, setCrop] = React.useState<Crop>();
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop>();
  const imageRef = React.useRef<HTMLImageElement | null>(null);

  function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
    return centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        mediaWidth,
        mediaHeight,
      ),
      mediaWidth,
      mediaHeight,
    );
  }

  function onImageLoad(width: number, height: number) {
    const newCrop = centerAspectCrop(width, height, aspect);
    setCrop(newCrop);
  }

  async function handleCropConfirm() {
    if (!completedCrop || !imageRef.current) {
      logError('Crop data or image ref is missing');
      return;
    }
    const croppedBlob = await getCroppedImageBlob(
      imageRef.current,
      completedCrop,
      1,
      0,
      compressionOptions,
    );
    if (croppedBlob) {
      onCropComplete(croppedBlob);
    }
  }

  function onChange(newCrop: Crop) {
    const MIN_CROP_SIZE = 10;
    if (
      newCrop.width &&
      newCrop.height &&
      newCrop.width >= MIN_CROP_SIZE &&
      newCrop.height >= MIN_CROP_SIZE
    ) {
      setCrop(newCrop);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white border-2 py-4 flex flex-col gap-3 px-6 max-w-full max-h-full overflow-auto">
        <h1 className="font-medium my-4">Bild ausschneiden</h1>
        <ReactCrop
          crop={crop}
          onChange={onChange}
          onComplete={(c: PixelCrop) => setCompletedCrop(c)}
          aspect={aspect}
          keepSelection
        >
          <Image
            alt="crop image"
            src={imageSrc}
            width={500}
            height={500}
            onLoadingComplete={(img: HTMLImageElement) => {
              imageRef.current = img as unknown as HTMLImageElement;
              if (imageRef.current) {
                onImageLoad(img.naturalWidth, img.naturalHeight);
              }
            }}
            className="object-contain max-w-full max-h-[80vh]"
          />
        </ReactCrop>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} type="button" className={buttonSecondaryClassName}>
            Abbrechen
          </button>
          <button className={buttonPrimaryClassName} onClick={handleCropConfirm} type="button">
            Bild hochladen
          </button>
        </div>
      </div>
    </div>
  );
}
