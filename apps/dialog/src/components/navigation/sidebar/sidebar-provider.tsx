'use client';

import useBreakpoints from '@/components/hooks/use-breakpoints';
import * as React from 'react';

export const ReadonlyContext = React.createContext<{
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}>({ isOpen: true, toggle: () => {}, close: () => {} });

export function useSidebarVisibility() {
  return React.useContext(ReadonlyContext);
}

export function SidebarVisibilityProvider({ children }: { children: React.ReactNode }) {
  const { isAtLeast } = useBreakpoints();
  const [isOpen, setOpen] = React.useState(true);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && isAtLeast.md) {
      setOpen(true);
    }
  }, [isAtLeast.md, setOpen]);

  function close() {
    setOpen(false);
  }

  return (
    <ReadonlyContext.Provider value={{ isOpen, toggle: () => setOpen((val) => !val), close }}>
      {children}
    </ReadonlyContext.Provider>
  );
}
