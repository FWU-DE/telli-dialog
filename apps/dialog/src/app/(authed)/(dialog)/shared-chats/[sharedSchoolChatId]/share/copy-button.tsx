'use client';

import React from 'react';
import CheckIcon from '@/components/icons/check';
import ClipboardIcon from '@/components/icons/clipboard';
import { cn } from '@/utils/tailwind';
import { useTranslations } from 'next-intl';

type CopyButtonProps = {
  text: string;
  buttonClassName?: React.ComponentProps<'button'>['className'];
  iconClassName?: React.ComponentProps<typeof ClipboardIcon>['className'];
};

export default function CopyButton({ text, buttonClassName, iconClassName }: CopyButtonProps) {
  const [isCopied, setIsCopied] = React.useState(false);

  const tCommon = useTranslations('common');

  function copyToClipboard() {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    });
  }

  return (
    <button aria-label={tCommon('copy')} onClick={copyToClipboard} className={buttonClassName}>
      {isCopied ? (
        <CheckIcon aria-hidden="true" className={cn(iconClassName, 'w-4 h-4')} />
      ) : (
        <ClipboardIcon aria-hidden="true" className={cn(iconClassName, 'w-4 h-4')} />
      )}
      <span className="sr-only">{tCommon('copy-clipboard')}</span>
    </button>
  );
}
