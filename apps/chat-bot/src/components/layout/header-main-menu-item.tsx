import type { ReactNode } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@ui/components/dropdown-menu';
import { CaretDownIcon } from '@phosphor-icons/react';

type HeaderMainMenuItemProps = {
  caption: string;
  triggerLabel: string;
  triggerAriaLabel: string;
  children: ReactNode;
};

export function HeaderMainMenuItem({
  caption,
  triggerLabel,
  triggerAriaLabel,
  children,
}: HeaderMainMenuItemProps) {
  return (
    <div className="flex flex-col gap-2 p-2">
      <span className="text-xs text-gray-600 hidden sm:block">{caption}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex flex-row gap-1.5 items-center text-primary text-base font-medium outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label={triggerAriaLabel}
          >
            {triggerLabel}
            <CaretDownIcon />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="px-0 py-0"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
          }}
        >
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
