'use client';

import { useSidebar } from '@telli/ui/components/Sidebar';
import NewDialogIcon from '@/components/icons/sidebar/new-dialog';
import { cn } from '@/utils/tailwind';
import { useRouter } from 'next/navigation';
import { iconClassName } from '@/utils/tailwind/icon';
import { SidebarSimpleIcon } from '@phosphor-icons/react';

export function ToggleSidebarButton({ forceVisibility = false }: { forceVisibility?: boolean }) {
  const { toggleSidebar, open, isMobile, openMobile } = useSidebar();
  const isOpen = isMobile ? openMobile : open;

  if (isOpen && !forceVisibility) return null;

  return (
    <button
      title="Sidebar"
      className={cn(
        'focus:outline-hidden group hover:bg-light-gray rounded-enterprise-sm',
        iconClassName,
      )}
      onClick={toggleSidebar}
      aria-label="sidebar-toggle-close"
    >
      <SidebarSimpleIcon className="w-6 h-6" />
    </button>
  );
}

export function NewChatButton({ forceVisibility = false }: { forceVisibility?: boolean }) {
  const { open, toggleSidebar, isMobile, openMobile } = useSidebar();
  const router = useRouter();
  const isOpen = isMobile ? openMobile : open;

  function handleOpenNewChat() {
    if (isMobile && openMobile) {
      toggleSidebar();
    }
    router.push('/');
  }

  if (isOpen && !forceVisibility) return null;

  return (
    <button
      onClick={handleOpenNewChat}
      className={cn(
        'focus:outline-hidden group hover:bg-light-gray rounded-enterprise-sm',
        iconClassName,
      )}
      aria-label="Neuer Chat"
      title="Neuer Chat"
    >
      <NewDialogIcon className="w-8 h-8" />
    </button>
  );
}
