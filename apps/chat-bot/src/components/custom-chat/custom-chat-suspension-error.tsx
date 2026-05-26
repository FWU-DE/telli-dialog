'use client';

import { WarningIcon } from '@phosphor-icons/react';

export function CustomChatSuspensionError({ info }: { info: string }) {
  return (
    <div
      className="mb-5 flex items-center gap-3 rounded-xl border border-error bg-error/3 px-6 py-4 text-base text-error-foreground"
      role="alert"
    >
      <WarningIcon className="text-error" size={24} />
      <span>{info}</span>
    </div>
  );
}
