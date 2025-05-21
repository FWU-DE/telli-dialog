'use client';

import { useSidebarVisibility } from './sidebar-provider';
import { useOutsideClick } from '@/components/hooks/use-outside-click';
import useBreakpoints from '@/components/hooks/use-breakpoints';
import React from 'react';
import NewDialogIcon from '@/components/icons/sidebar/new-dialog';
import SidebarToggleIcon from '@/components/icons/sidebar/sidebar-toggle';
import { cn } from '@/utils/tailwind';
import { useRouter } from 'next/navigation';
import { iconClassName } from '@/utils/tailwind/icon';

export default function CollapsibleSidebar({ children }: { children: React.ReactNode }) {
  const { isOpen, toggle } = useSidebarVisibility();
  const { isBelow } = useBreakpoints();

  const ref = useOutsideClick<HTMLDivElement>(() => {
    if (isOpen && typeof window !== 'undefined' && isBelow.md) {
      toggle();
    }
  });

  React.useEffect(() => {
    if (isBelow.md && isOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }

    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isBelow.md, isOpen]);

  return (
    <div className="flex h-[100dvh] pointer-events-auto z-20 bg-white">
      <div
        ref={ref}
        className={cn(
          'fixed inset-y-0 h-[100dvh] shadow-3xl left-0 transition-all duration-200 transform w-72 md:relative overflow-y-auto overflow-x-hidden flex flex-col bg-semilight-gray',
          isOpen ? 'translate-x-0 ease-out' : '-translate-x-full ease-in md:w-0 md:translate-x-0',
        )}
      >
        <div className={cn('flex gap-4 items-center px-6 mt-[22px] mb-4', !isOpen && 'invisible')}>
          <ToggleSidebarButton forceVisibility />
          <div className="flex-grow" />
          <NewChatButton forceVisibility />
        </div>
        {children}
      </div>
    </div>
  );
}

export function ToggleSidebarButton({ forceVisibility = false }: { forceVisibility?: boolean }) {
  const { toggle, isOpen } = useSidebarVisibility();

  if (isOpen && !forceVisibility) return null;

  return (
    <button
      title="Sidebar"
      className={cn(
        'focus:outline-none group hover:bg-light-gray rounded-enterprise-sm',
        iconClassName,
      )}
      onClick={() => toggle()}
      aria-label="sidebar-toggle-close"
    >
      <SidebarToggleIcon />
    </button>
  );
}

export function NewChatButton({ forceVisibility = false }: { forceVisibility?: boolean }) {
  const { isOpen, toggle } = useSidebarVisibility();
  const { isBelow } = useBreakpoints();
  const router = useRouter();

  function handleOpenNewChat() {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    isBelow.md && isOpen && toggle();
    router.push('/');
  }

  if (isOpen && !forceVisibility) return null;

  return (
    <button
      onClick={handleOpenNewChat}
      className={cn(
        'focus:outline-none group hover:bg-light-gray rounded-enterprise-sm',
        iconClassName,
      )}
      aria-label="Neuer Chat"
      title="Neuer Chat"
    >
      <NewDialogIcon />
    </button>
  );
}
