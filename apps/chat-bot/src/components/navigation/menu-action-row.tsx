'use client';

import React from 'react';

export function MenuActionRow({
  action,
  onSelect,
}: {
  action: React.ReactNode;
  onSelect?: () => void;
}) {
  // The onSelect prop is for shadcn DropdownMenuItem
  return (
    <div
      role="menuitem"
      tabIndex={0}
      className="flex p-2 pl-4 [&_button]:h-auto [&_button]:justify-start [&_button]:border-none [&_button]:bg-transparent [&_button]:px-0 [&_button]:py-0 [&_button]:flex-row [&_button]:gap-2 [&_button]:text-base [&_button]:font-normal [&_button:hover]:bg-transparent [&_button:hover]:underline [&_button:hover]:text-primary"
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect?.();
        }
      }}
    >
      {action}
    </div>
  );
}
