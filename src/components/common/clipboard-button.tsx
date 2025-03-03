'use client';

import CheckIcon from '../icons/check';
import React from 'react';
import ClipboardLightIcon from '../icons/clipboard-light';
import { ClipboardButton } from '@deutschlandgpt/core';

type TelliClipboardButtonProps = {
  text: string;
};

export default function TelliClipboardButton({ text }: TelliClipboardButtonProps) {
  return (
    <ClipboardButton
      text={text}
      clipIcon={
        <div className="p-1.5 rounded-enterprise-sm hover:bg-vidis-hover-green/20">
          <ClipboardLightIcon className="text-primary w-5 h-5" />
        </div>
      }
      checkIcon={
        <div className="p-1.5 rounded-enterprise-sm hover:bg-secondary/20">
          <CheckIcon className="text-primary w-5 h-5" />
        </div>
      }
    />
  );
}
