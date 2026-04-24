'use client';

import type { UserAndContext } from '@/auth/types';
import ProfileMenu, { ThreeDotsProfileMenu } from '@/components/navigation/profile-menu';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import useBreakpoints from '@/components/hooks/use-breakpoints';
import { reductionBreakpoint } from '@/utils/tailwind/layout';

type DialogHeaderContextValue = {
  headerContent: ReactNode;
  setHeaderContent: (content: ReactNode) => void;
  compactMenuContent: ReactNode;
  setCompactMenuContent: (content: ReactNode) => void;
};

const DialogHeaderContext = createContext<DialogHeaderContextValue | null>(null);

export function DialogHeaderProvider({ children }: { children: ReactNode }) {
  const [headerContent, setHeaderContent] = useState<ReactNode>(null);
  const [compactMenuContent, setCompactMenuContent] = useState<ReactNode>(null);

  const value = useMemo(
    () => ({
      headerContent,
      setHeaderContent,
      compactMenuContent,
      setCompactMenuContent,
    }),
    [headerContent, compactMenuContent],
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

export function DialogHeader({ userAndContext }: { userAndContext?: UserAndContext }) {
  const { headerContent, compactMenuContent } = useDialogHeader();
  const { isBelow } = useBreakpoints();
  const isCompact = isBelow[reductionBreakpoint];

  return (
    <header className="h-19 flex-none px-6 py-4 flex items-center justify-between gap-4">
      <ToggleSidebarButton />
      <div className="min-w-0 flex-1">{headerContent}</div>
      {isCompact && compactMenuContent ? (
        <ThreeDotsProfileMenu
          downloadButtonJSX={compactMenuContent}
          userAndContext={userAndContext}
        />
      ) : (
        <ProfileMenu userAndContext={userAndContext} />
      )}
    </header>
  );
}

export function DialogWrapper({
  children,
  userAndContext,
}: {
  children: ReactNode;
  userAndContext?: UserAndContext;
}) {
  return (
    <DialogHeaderProvider>
      <div className="relative flex flex-col h-dvh w-dvw overflow-hidden bg-background-2">
        <DialogHeader userAndContext={userAndContext} />
        <main className="min-h-0 w-full mx-auto flex-1 overflow-auto">{children}</main>
      </div>
    </DialogHeaderProvider>
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

/**
 * Declares what content appears inside ThreeDotsProfileMenu when the header is compact
 * (below the reductionBreakpoint). If nothing is set, a plain ProfileMenu is shown instead.
 */
export function DialogHeaderCompactMenuContent({ children }: { children: ReactNode }) {
  const { setCompactMenuContent } = useDialogHeader();

  useEffect(() => {
    setCompactMenuContent(children);
  }, [children, setCompactMenuContent]);

  useEffect(() => {
    return () => {
      setCompactMenuContent(null);
    };
  }, [setCompactMenuContent]);

  return null;
}
