'use client';

import { HELP_MODE_GPT_ID } from '@shared/db/const';
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@telli/ui/components/Sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cloneElement, type ReactElement } from 'react';

type AppMenuItemProps = {
  href: string;
  icon: ReactElement<{ weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' }>;
  text: string;
};

export function AppMenuItem({ href, icon, text }: AppMenuItemProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const isActive = () => {
    // special case for help mode because it is also a custom gpt and starts with the same path
    if (pathname.startsWith(`/custom/d/${HELP_MODE_GPT_ID}`)) return pathname === href;

    return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive()}>
        <Link
          href={href}
          onClick={() => {
            if (isMobile) {
              setOpenMobile(false);
            }
          }}
          prefetch={false}
        >
          <span className="text-primary">
            {cloneElement(icon, { weight: isActive() ? 'bold' : 'regular' })}
          </span>
          <span>{text}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default AppMenuItem;
