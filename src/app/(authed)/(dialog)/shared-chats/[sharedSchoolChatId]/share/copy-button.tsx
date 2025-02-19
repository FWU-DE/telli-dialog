'use client';

import React from 'react';
import CheckIcon from '@/components/icons/check';
import ClipboardIcon from '@/components/icons/clipboard';
import { cn } from '@/utils/tailwind';

type CopyButtonProps = {
  text: string;
  buttonClassName?: React.ComponentProps<'button'>['className'];
  iconClassName?: React.ComponentProps<typeof ClipboardIcon>['className'];
};

export default function CopyButton({ text, buttonClassName, iconClassName }: CopyButtonProps) {
  const [isCopied, setIsCopied] = React.useState(false);

  function copyToClipboard() {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    });
  }

  return (
    <button onClick={copyToClipboard} className={buttonClassName}>
      {isCopied ? (
        <CheckIcon className={cn('text-secondary', iconClassName ?? 'w-4 h-4')} />
      ) : (
        <ClipboardIcon
          className={cn('text-primary hover:text-secondary', iconClassName ?? 'w-4 h-4')}
        />
      )}
    </button>
  );
}
