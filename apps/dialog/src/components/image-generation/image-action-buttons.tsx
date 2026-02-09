'use client';

import React from 'react';
import { useToast } from '../common/toast';
import { CopyIcon, InfoIcon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { logError } from '@shared/logging';

interface ImageActionButtonsProps {
  imageRef: React.RefObject<HTMLImageElement | null>;
  prompt: string;
}

export function ImageActionButtons({ imageRef, prompt }: ImageActionButtonsProps) {
  const toast = useToast();
  const t = useTranslations('image-generation');

  async function handleCopyImage() {
    try {
      const img = imageRef.current;
      if (!img || !img.complete) {
        throw new Error('Image not loaded');
      }

      // construct ClipboardItem with a Promise for Safari compatibility
      const blobPromise = new Promise<Blob>((resolve, reject) => {
        // Create a canvas in memory without adding it to the DOM
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        try {
          ctx.drawImage(img, 0, 0);
        } catch (drawError) {
          reject(drawError);
          return;
        }

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create image blob'));
          }
        }, 'image/png');
      });

      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })]);
      toast.success(t('copy-image-success'));
    } catch (error) {
      logError('Failed to copy image to clipboard', error);
      toast.error(t('copy-image-error'));
    }
  }

  function handleCopyPrompt() {
    navigator.clipboard
      .writeText(prompt)
      .then(() => {
        toast.success(t('copy-prompt-success'));
      })
      .catch(() => {
        toast.error(t('copy-prompt-error'));
      });
  }

  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={handleCopyImage}
        className="flex items-center justify-center text-primary transition-colors"
        title={t('copy-image-tooltip')}
      >
        <CopyIcon size={16} />
      </button>
      <button
        onClick={handleCopyPrompt}
        className="flex items-center justify-center text-primary transition-colors"
        title={t('copy-prompt-tooltip')}
      >
        <InfoIcon size={16} />
      </button>
    </div>
  );
}
