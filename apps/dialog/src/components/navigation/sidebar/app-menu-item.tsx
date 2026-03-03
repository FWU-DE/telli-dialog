'use client';

import { SidebarMenuButton, SidebarMenuItem } from '@telli/ui/components/Sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type AppMenuItemProps = {
  href: string;
  icon: ReactNode;
  text: string;
};

export function AppMenuItem({ href, icon, text }: AppMenuItemProps) {
  const pathname = usePathname();
  const isActive =
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link
          className="hover:underline hover:text-primary hover:data-[active=true]:text-primary"
          href={href}
          prefetch={false}
        >
          <span className="text-primary">{icon}</span>
          <span className="font-normal text-base text-primary">{text}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default AppMenuItem;
