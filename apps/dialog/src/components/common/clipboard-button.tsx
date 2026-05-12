'use client';

import CheckIcon from '../icons/check';
import React from 'react';
import ClipboardLightIcon from '../icons/clipboard-light';
import { Button } from '@ui/components/Button';
import { useTranslations } from 'next-intl';

type CopyToClipboardButtonProps = {
  text: string;
  className?: string;
};

export default function CopyToClipboardButton({ text, className }: CopyToClipboardButtonProps) {
  const t = useTranslations('common');
  const [isCopied, setIsCopied] = React.useState(false);

  React.useEffect(() => {
    if (!isCopied) {
      return;
    }

    const timeout = setTimeout(() => {
      setIsCopied(false);
    }, 2000);

    return () => {
      clearTimeout(timeout);
    };
  }, [isCopied]);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
    } catch {
      setIsCopied(false);
    }
  }, [text]);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-round"
      aria-label={t('copy-clipboard')}
      data-testid="copy-to-clipboard"
      onClick={handleCopy}
      className="text-primary"
    >
      {isCopied ? (
        <CheckIcon className={className} />
      ) : (
        <ClipboardLightIcon className={className} />
      )}
    </Button>
  );
}
