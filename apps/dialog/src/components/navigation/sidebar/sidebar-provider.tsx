'use client';

import useBreakpoints from '@/components/hooks/use-breakpoints';
import { useSidebar } from '@ui/components/Sidebar';
import * as React from 'react';

export const ReadonlyContext = React.createContext<{
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}>({ isOpen: true, toggle: () => {}, close: () => {} });

export function useSidebarVisibility() {
  return React.useContext(ReadonlyContext);
}

// Todo: After ui redesign, we should switch to useSidbar() and remove this provider
export function SidebarVisibilityProvider({ children }: { children: React.ReactNode }) {
  const { isAtLeast, isBelow } = useBreakpoints();
  const [isOpen, setOpen] = React.useState(true);
  const { setOpen: setOpen2, setOpenMobile } = useSidebar();

  // set correct initial state on desktop
  React.useEffect(() => {
    if (typeof window !== 'undefined' && isAtLeast.md) {
      setOpen(true);
      setOpenMobile(false);
    }
  }, [isAtLeast.md, setOpen, setOpenMobile]);

  // set correct initial state on mobile
  React.useEffect(() => {
    if (typeof window !== 'undefined' && isBelow.md) {
      setOpen(false);
      setOpenMobile(false);
    }
  }, [isBelow.md, setOpen, setOpenMobile]);

  function close() {
    setOpen(false);
    setOpen2(false);
    setOpenMobile(false);
  }

  function toggle() {
    setOpen(!isOpen);
    setOpen2(!isOpen);
    setOpenMobile(!isOpen);
  }

  return (
    <ReadonlyContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </ReadonlyContext.Provider>
  );
}
