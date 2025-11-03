import Link from 'next/link';

/**
 * Sidebar
 */
export type SidebarProps = {
  children: React.ReactNode;
};

export function Sidebar({ children }: SidebarProps) {
  return (
    <div className="flex flex-col gap-4 w-[240px] p-6">
      <div className="text-sm text-gray-500 font-bold tracking-widest uppercase">Navigation</div>
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
    <Link href={href} className="block">
      {label}
    </Link>
  );
}
