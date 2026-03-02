import { SidebarMenuButton, SidebarMenuItem } from '@telli/ui/components/Sidebar';
import Link from 'next/link';
import type { ReactNode } from 'react';

type AppMenuItemProps = {
  href: string;
  icon: ReactNode;
  text: string;
};

export function AppMenuItem({ href, icon, text }: AppMenuItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <Link href={href} prefetch={false}>
          {icon}
          <span>{text}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default AppMenuItem;
