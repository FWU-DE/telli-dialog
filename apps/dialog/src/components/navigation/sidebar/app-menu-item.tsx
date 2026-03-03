'use client';

import { HELP_MODE_GPT_ID } from '@shared/db/const';
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
  const isActive = () => {
    // special case for help mode because it is also a custom gpt and starts with the same path
    if (pathname.startsWith(`/custom/d/${HELP_MODE_GPT_ID}`)) return pathname === href;

    return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive()}>
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
