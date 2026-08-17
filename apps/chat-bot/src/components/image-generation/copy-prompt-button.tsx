'use client';

import React from 'react';
import { CopyIcon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';
import { Button } from '@ui/components/button';
import { useToast } from '../common/toast';

interface CopyPromptButtonProps {
  prompt: string;
}

export function CopyPromptButton({ prompt }: CopyPromptButtonProps) {
  const t = useTranslations('image-generation');
  const toast = useToast();

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
    <Button
      onClick={handleCopyPrompt}
      variant="ghost"
      size="icon-sm"
      title={t('copy-prompt-tooltip')}
      aria-label={t('copy-prompt-tooltip')}
      data-testid="image-copy-prompt-button"
      className="ml-1 align-middle"
    >
      <CopyIcon />
    </Button>
  );
}
