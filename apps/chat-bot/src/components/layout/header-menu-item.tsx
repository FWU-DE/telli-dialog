import { DropdownMenuItem } from '@ui/components/dropdown-menu';

export type HeaderMenuItemProps = {
  onClick: () => void;
  children: React.ReactNode;
};

export function HeaderMenuItem({ onClick, children }: HeaderMenuItemProps) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      className="flex flex-row gap-3 items-center px-4 py-2.5 text-primary text-sm font-medium focus:bg-primary/15 rounded-none"
    >
      {children}
    </DropdownMenuItem>
  );
}
