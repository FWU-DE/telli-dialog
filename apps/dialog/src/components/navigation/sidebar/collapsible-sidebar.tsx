'use client';

import { useSidebar } from '@telli/ui/components/Sidebar';
import NewDialogIcon from '@/components/icons/sidebar/new-dialog';
import { useRouter } from 'next/navigation';
import { SidebarSimpleIcon } from '@phosphor-icons/react';
import { Button } from '@ui/components/Button';

export function ToggleSidebarButton({ forceVisibility = false }: { forceVisibility?: boolean }) {
  const { toggleSidebar, open, isMobile, openMobile } = useSidebar();
  const isOpen = isMobile ? openMobile : open;

  if (isOpen && !forceVisibility) return null;

  return (
    <Button
      variant="ghost"
      size="icon-round"
      title="Sidebar"
      className="text-primary"
      onClick={toggleSidebar}
      aria-label="sidebar-toggle-close"
    >
      <SidebarSimpleIcon className="size-6" />
    </Button>
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
    <Button
      variant="ghost"
      size="icon-round"
      onClick={handleOpenNewChat}
      className="text-primary"
      aria-label="Neuer Chat"
      title="Neuer Chat"
    >
      <NewDialogIcon className="size-8" />
    </Button>
  );
}
