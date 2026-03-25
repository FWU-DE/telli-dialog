'use client';

import { useSidebar } from '@telli/ui/components/Sidebar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@telli/ui/components/Sheet';
import React from 'react';
import NewDialogIcon from '@/components/icons/sidebar/new-dialog';
import SidebarToggleIcon from '@/components/icons/sidebar/sidebar-toggle';
import { cn } from '@/utils/tailwind';
import { iconClassName } from '@/utils/tailwind/icon';
import { SidebarSimpleIcon } from '@phosphor-icons/react/dist/icons/SidebarSimple';

export default function CollapsibleSidebar({
  children,
  isNewUiDesignEnabled,
}: {
  children: React.ReactNode;
  isNewUiDesignEnabled: boolean;
}) {
  const { open, isMobile, openMobile, setOpenMobile } = useSidebar();

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          side="left"
          className="w-72 p-0 bg-semilight-gray overflow-y-auto overflow-x-hidden flex flex-col [&>button]:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Hauptnavigation</SheetDescription>
          </SheetHeader>
          <div className="flex gap-4 items-center px-6 mt-[22px] mb-4">
            <ToggleSidebarButton forceVisibility isNewUiDesignEnabled={isNewUiDesignEnabled} />
            <div className="grow" />
            <NewChatButton forceVisibility />
          </div>
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className={cn(
        'relative z-20 h-dvh shadow-3xl transition-[width] duration-200 flex flex-col bg-semilight-gray',
        open ? 'w-72' : 'w-0 overflow-hidden',
      )}
    >
      <div className={cn('flex gap-4 items-center px-6 mt-[22px] mb-4', !open && 'invisible')}>
        <ToggleSidebarButton forceVisibility isNewUiDesignEnabled={isNewUiDesignEnabled} />
        <div className="grow" />
        <NewChatButton forceVisibility />
      </div>
      {children}
    </div>
  );
}

export function ToggleSidebarButton({
  forceVisibility = false,
  isNewUiDesignEnabled,
}: {
  forceVisibility?: boolean;
  isNewUiDesignEnabled: boolean;
}) {
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
      {isNewUiDesignEnabled ? <SidebarSimpleIcon className="w-6 h-6" /> : <SidebarToggleIcon />}
    </button>
  );
}

export function NewChatButton({ forceVisibility = false }: { forceVisibility?: boolean }) {
  const { open, toggleSidebar, isMobile, openMobile } = useSidebar();
  const isOpen = isMobile ? openMobile : open;

  function handleOpenNewChat() {
    if (isMobile && openMobile) {
      toggleSidebar();
    }
    // After the first message in a new chat the URL is updated via window.history.replaceState
    // (to avoid a full component remount). Next.js's router doesn't know about that change, so
    // router.push('/') may serve a cached page render with the same UUID key — leaving the old
    // conversation visible. A hard navigation always produces a fresh server render.
    window.location.href = '/';
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
