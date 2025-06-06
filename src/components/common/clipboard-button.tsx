'use client';

import CheckIcon from '../icons/check';
import React from 'react';
import ClipboardLightIcon from '../icons/clipboard-light';
import { ClipboardButton } from '@deutschlandgpt/core';
import { iconClassName } from '@/utils/tailwind/icon';
import { cn } from '@/utils/tailwind';

type TelliClipboardButtonProps = {
  text: string;
  className?: string;
  outerDivClassName?: string;
};

export default function TelliClipboardButton({
  text,
  className,
  outerDivClassName,
}: TelliClipboardButtonProps) {
  return (
    <ClipboardButton
      text={text}
      clipIcon={
        <div className={cn('p-1.5 rounded-enterprise-sm', iconClassName, outerDivClassName)}>
          <ClipboardLightIcon className={className} />
        </div>
      }
      checkIcon={
        <div className={cn('p-1.5 rounded-enterprise-sm', iconClassName, outerDivClassName)}>
          <CheckIcon className={className} />
        </div>
      }
    />
  );
}
