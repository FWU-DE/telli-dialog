'use client';

import type { UserAndContext } from '@/auth/types';
import ProfileMenu, { ThreeDotsProfileMenu } from '@/components/navigation/profile-menu';
import { ToggleSidebarButton } from '@/components/navigation/sidebar/collapsible-sidebar';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import useBreakpoints from '@/components/hooks/use-breakpoints';
import { reductionBreakpoint } from '@/utils/tailwind/layout';

type DialogHeaderContextValue = {
  headerMountNode: HTMLDivElement | null;
  setHeaderMountNode: (node: HTMLDivElement | null) => void;
  compactMenuMountNode: HTMLDivElement | null;
  setCompactMenuMountNode: (node: HTMLDivElement | null) => void;
  hasCompactMenuContent: boolean;
  setHasCompactMenuContent: (hasCompactMenuContent: boolean) => void;
};

const DialogHeaderContext = createContext<DialogHeaderContextValue | null>(null);

export function DialogHeaderProvider({ children }: { children: ReactNode }) {
  const [headerMountNode, setHeaderMountNode] = useState<HTMLDivElement | null>(null);
  const [compactMenuMountNode, setCompactMenuMountNode] = useState<HTMLDivElement | null>(null);
  const [hasCompactMenuContent, setHasCompactMenuContent] = useState(false);

  const value = useMemo(
    () => ({
      headerMountNode,
      setHeaderMountNode,
      compactMenuMountNode,
      setCompactMenuMountNode,
      hasCompactMenuContent,
      setHasCompactMenuContent,
    }),
    [headerMountNode, compactMenuMountNode, hasCompactMenuContent],
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
  const { setHeaderMountNode, setCompactMenuMountNode, hasCompactMenuContent } = useDialogHeader();
  const { isBelow } = useBreakpoints();
  const isCompact = isBelow[reductionBreakpoint];
  const headerMountNodeRef = useRef<HTMLDivElement | null>(null);
  const compactMenuMountNodeRef = useRef<HTMLDivElement | null>(null);

  const headerMountRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (headerMountNodeRef.current === node) {
        return;
      }

      headerMountNodeRef.current = node;
      setHeaderMountNode(node);
    },
    [setHeaderMountNode],
  );

  const compactMenuMountRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (compactMenuMountNodeRef.current === node) {
        return;
      }

      compactMenuMountNodeRef.current = node;
      setCompactMenuMountNode(node);
    },
    [setCompactMenuMountNode],
  );

  return (
    <header className="h-19 flex-none px-6 py-4 flex items-center justify-between gap-4">
      <ToggleSidebarButton />
      <div className="min-w-0 flex-1">
        <div className="w-full" ref={headerMountRef} />
      </div>
      {isCompact && hasCompactMenuContent ? (
        <ThreeDotsProfileMenu
          downloadButtonJSX={<div ref={compactMenuMountRef} />}
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
  const { headerMountNode } = useDialogHeader();

  if (!headerMountNode) {
    return null;
  }

  return createPortal(children, headerMountNode);
}

/**
 * Declares what content appears inside ThreeDotsProfileMenu when the header is compact
 * (below the reductionBreakpoint). If nothing is set, a plain ProfileMenu is shown instead.
 */
export function DialogHeaderCompactMenuContent({ children }: { children: ReactNode }) {
  const { compactMenuMountNode, setHasCompactMenuContent } = useDialogHeader();

  useEffect(() => {
    setHasCompactMenuContent(true);
    return () => {
      setHasCompactMenuContent(false);
    };
  }, [setHasCompactMenuContent]);

  if (!compactMenuMountNode) {
    return null;
  }

  return createPortal(children, compactMenuMountNode);
}
