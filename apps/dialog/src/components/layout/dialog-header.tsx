'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type DialogHeaderContextValue = {
  headerContent: ReactNode;
  setHeaderContent: (content: ReactNode) => void;
};

const DialogHeaderContext = createContext<DialogHeaderContextValue | null>(null);

export function DialogHeaderProvider({ children }: { children: ReactNode }) {
  const [headerContent, setHeaderContent] = useState<ReactNode>(null);

  const value = useMemo(
    () => ({
      headerContent,
      setHeaderContent,
    }),
    [headerContent],
  );

  return <DialogHeaderContext.Provider value={value}>{children}</DialogHeaderContext.Provider>;
}

function useDialogHeader() {
  const context = useContext(DialogHeaderContext);

  if (!context) {
    throw new Error('useDialogHeader must be used within DialogHeaderProvider');
  }

  return context;
}

export function DialogHeader() {
  const { headerContent } = useDialogHeader();

  return (
    <header className="h-19 flex-none px-6 py-4 flex items-center justify-between gap-4">
      {headerContent}
    </header>
  );
}

export function DialogHeaderContent({ children }: { children: ReactNode }) {
  const { setHeaderContent } = useDialogHeader();

  useEffect(() => {
    setHeaderContent(children);
  }, [children, setHeaderContent]);

  useEffect(() => {
    return () => {
      setHeaderContent(null);
    };
  }, [setHeaderContent]);

  return null;
}
