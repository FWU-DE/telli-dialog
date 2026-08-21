import type { ReactNode } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@ui/components/dropdown-menu';
import { CaretDownIcon } from '@phosphor-icons/react';
import { GreenLeafIcon } from '../icons/green-leaf-icon';
import { Badge } from '../common/badge';

type HeaderMainMenuItemProps = {
  caption: string;
  triggerLabel: string;
  triggerAriaLabel: string;
  children: ReactNode;
  isDropdownEnabled?: boolean;
  'data-testid'?: string;
  isNew?: boolean;
  isGreen?: boolean;
};

export function HeaderMainMenuItem({
  caption,
  triggerLabel,
  triggerAriaLabel,
  children,
  isDropdownEnabled = true,
  isNew,
  isGreen,
  'data-testid': dataTestId,
}: HeaderMainMenuItemProps) {
  const triggerButton = (
    <button
      type="button"
      disabled={!isDropdownEnabled}
      className="flex flex-row gap-1.5 items-center text-primary text-base font-medium outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none"
      aria-label={triggerAriaLabel}
      data-testid={dataTestId}
    >
      {triggerLabel}
      {isGreen && <GreenLeafIcon />}
      {isNew && <Badge text="NEU" />}
      {isDropdownEnabled && <CaretDownIcon />}
    </button>
  );

  return (
    <div className="flex flex-col gap-2 p-2">
      <span className="text-xs text-gray-600 hidden sm:block">{caption}</span>
      {isDropdownEnabled ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
          <DropdownMenuContent
            className="px-0 py-0"
            onCloseAutoFocus={(event) => {
              event.preventDefault();
            }}
          >
            {children}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        triggerButton
      )}
    </div>
  );
}
