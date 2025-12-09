'use client';

import React from 'react';
import { useToast } from '../common/toast';
import { CopyIcon, InfoIcon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';

interface ImageActionButtonsProps {
  imageUrl: string;
  prompt: string;
}

export function ImageActionButtons({ imageUrl, prompt }: ImageActionButtonsProps) {
  const toast = useToast();
  const t = useTranslations('image-generation');

  async function handleCopyImage() {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        toast.success('Image copied to clipboard');
      }
    } catch {
      toast.error('Failed to copy image');
    }
  }

  function handleCopyPrompt() {
    navigator.clipboard
      .writeText(prompt)
      .then(() => {
        toast.success('Prompt copied to clipboard');
      })
      .catch(() => {
        toast.error('Failed to copy prompt');
      });
  }

  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={handleCopyImage}
        className="flex items-center justify-center text-primary transition-colors"
        title="Copy image"
      >
        <CopyIcon size={16} />
      </button>
      <button
        onClick={handleCopyPrompt}
        className="flex items-center justify-center text-primary transition-colors"
        title="Copy prompt"
      >
        <InfoIcon size={16} />
      </button>
    </div>
  );
}
