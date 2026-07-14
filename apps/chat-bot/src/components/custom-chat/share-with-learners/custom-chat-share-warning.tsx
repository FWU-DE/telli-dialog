'use client';

import { WarningIcon } from '@phosphor-icons/react';

export function CustomChatShareWarning({ info }: { info: string }) {
  return (
    <div
      className="flex min-h-16 items-center gap-3 rounded-xl border border-warning/50 bg-warning/10 px-6 py-4 text-base text-foreground"
      role="alert"
    >
      <WarningIcon className="shrink-0 text-warning" size={24} />
      <span>{info}</span>
    </div>
  );
}
