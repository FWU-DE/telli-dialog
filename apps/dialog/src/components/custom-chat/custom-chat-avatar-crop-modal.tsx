'use client';

import React from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { buttonPrimaryClassName, buttonSecondaryClassName } from '@/utils/tailwind/button';
import Image from 'next/image';
import { CompressionOptions, getCroppedImageBlob } from '@/utils/files/image-utils';
import { logError } from '@shared/logging';
import { useTranslations } from 'next-intl';

type AvatarCropModalProps = {
  imageSrc: string;
  aspect: number;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
  compressionOptions?: CompressionOptions;
};

export default function AvatarCropModal({
  imageSrc,
  aspect,
  onClose,
  onCropComplete,
  compressionOptions,
}: AvatarCropModalProps) {
  const [crop, setCrop] = React.useState<Crop>();
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop>();
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const tCustomChatImage = useTranslations('custom-chat.image');
  const tCommon = useTranslations('common');

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white border-2 py-4 flex flex-col gap-3 px-6 max-w-full max-h-full overflow-auto">
        <h1 className="font-medium my-4">{tCustomChatImage('crop-image')}</h1>
        <ReactCrop
          crop={crop}
          onChange={onChange}
          onComplete={(c: PixelCrop) => setCompletedCrop(c)}
          aspect={aspect}
          circularCrop
          keepSelection
        >
          <Image
            ref={imageRef}
            alt="crop image"
            src={imageSrc}
            width={500}
            height={500}
            onLoad={(e) => onImageLoad(e.currentTarget.naturalWidth, e.currentTarget.naturalHeight)}
            className="object-contain max-w-full max-h-[80vh]"
          />
        </ReactCrop>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} type="button" className={buttonSecondaryClassName}>
            {tCommon('cancel')}
          </button>
          <button className={buttonPrimaryClassName} onClick={handleCropConfirm} type="button">
            {tCustomChatImage('upload-image')}
          </button>
        </div>
      </div>
    </div>
  );
}
