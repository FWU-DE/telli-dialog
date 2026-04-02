'use client';

import React from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import Image from 'next/image';
import { CompressionOptions, getCroppedImageBlob } from '@/utils/files/image-utils';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/Card';
import { Button } from '@ui/components/Button';
import { cn } from '@/utils/tailwind';
import { buttonPrimaryClassName } from '@/utils/tailwind/button';
import { useToast } from '../common/toast';

type AvatarCropModalProps = {
  imageSrc: string;
  aspect: number;
  circularCrop?: boolean;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => Promise<void>;
  compressionOptions?: CompressionOptions;
};

export default function AvatarCropModal({
  imageSrc,
  aspect,
  circularCrop = false,
  onClose,
  onCropComplete,
  compressionOptions,
}: AvatarCropModalProps) {
  const [crop, setCrop] = React.useState<Crop>();
  const [completedCrop, setCompletedCrop] = React.useState<PixelCrop>();
  const [isUploading, setIsUploading] = React.useState(false);
  const imageRef = React.useRef<HTMLImageElement | null>(null);
  const toast = useToast();
  const t = useTranslations('custom-chat.image');
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
      toast.error(t('toasts.image-toast-error'));
      return;
    }
    setIsUploading(true);
    try {
      const croppedBlob = await getCroppedImageBlob(
        imageRef.current,
        completedCrop,
        compressionOptions,
      );
      await onCropComplete(croppedBlob);
    } catch {
      toast.error(t('toasts.image-toast-error'));
    } finally {
      setIsUploading(false);
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
      <Card>
        <CardHeader>
          <CardTitle>{t('crop-image')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReactCrop
            crop={crop}
            onChange={onChange}
            onComplete={(c: PixelCrop) => setCompletedCrop(c)}
            aspect={aspect}
            circularCrop={circularCrop}
            keepSelection
          >
            <Image
              alt={t('crop-image')}
              src={imageSrc}
              width={500}
              height={500}
              onLoadingComplete={(img) => {
                imageRef.current = img;
                onImageLoad(img.naturalWidth, img.naturalHeight);
              }}
              className="object-contain max-w-full max-h-[80vh]"
            />
          </ReactCrop>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={onClose} type="button" variant="outline" disabled={isUploading}>
              {tCommon('cancel')}
            </Button>
            <Button
              onClick={handleCropConfirm}
              type="button"
              disabled={isUploading}
              className={cn(buttonPrimaryClassName)}
            >
              {t('upload-image')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
