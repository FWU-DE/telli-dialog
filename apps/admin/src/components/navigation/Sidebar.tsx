import { Button } from '@ui/components/Button';
import Link from 'next/link';

/**
 * Sidebar
 */
export type SidebarProps = {
  children: React.ReactNode;
};

export function Sidebar({ children }: SidebarProps) {
  return (
    <div className="flex flex-col gap-0 w-[240px] p-6">
      <div className="py-4 text-sm text-primary font-bold tracking-widest uppercase">
        Navigation
      </div>
      {children}
    </div>
  );
}

/**
 * SidebarItem
 */
export type SidebarItemProps = {
  label: string;
  href: string;
};

export function SidebarItem({ label, href }: SidebarItemProps) {
  return (
    <Link href={href}>
      <Button variant="link" className="pl-0">
        {label}
      </Button>
    </Link>
  );
}
