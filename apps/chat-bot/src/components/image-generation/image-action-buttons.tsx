'use client';

import React from 'react';
import { useToast } from '../common/toast';
import { CopyIcon, DownloadSimpleIcon, InfoIcon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { logError } from '@shared/logging';
import { Button } from '@ui/components/button';
import { downloadFileFromBlob } from '@/utils/files/blob-download';

interface ImageActionButtonsProps {
  imageRef: React.RefObject<HTMLImageElement | null>;
  fileId: string;
  prompt: string;
  isImageReady: boolean;
}

export function ImageActionButtons({
  imageRef,
  fileId,
  prompt,
  isImageReady,
}: ImageActionButtonsProps) {
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

  async function handleDownloadImage() {
    try {
      const img = imageRef.current;
      if (!img || !img.complete || !img.currentSrc) {
        throw new Error('Image not loaded');
      }

      const response = await fetch(img.currentSrc);
      if (!response.ok) {
        throw new Error('Failed to fetch image for download');
      }

      const blob = await response.blob();
      downloadFileFromBlob(blob, `AIS.chat-Bild-${fileId}.png`);
    } catch (error) {
      logError('Failed to download image', error);
      toast.error(t('download-image-error'));
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
    <div className="flex mt-1.5">
      <Button
        onClick={handleCopyImage}
        variant="ghost"
        size="icon-sm"
        title={t('copy-image-tooltip')}
        aria-label={t('copy-image-tooltip')}
        data-testid="image-copy-button"
        disabled={!isImageReady}
      >
        <CopyIcon />
      </Button>
      <Button
        onClick={handleDownloadImage}
        variant="ghost"
        size="icon-sm"
        title={t('download-image-tooltip')}
        aria-label={t('download-image-tooltip')}
        data-testid="image-download-button"
        disabled={!isImageReady}
      >
        <DownloadSimpleIcon />
      </Button>
      <Button
        onClick={handleCopyPrompt}
        variant="ghost"
        size="icon-sm"
        title={t('copy-prompt-tooltip')}
        aria-label={t('copy-prompt-tooltip')}
        data-testid="image-copy-prompt-button"
      >
        <InfoIcon />
      </Button>
    </div>
  );
}
