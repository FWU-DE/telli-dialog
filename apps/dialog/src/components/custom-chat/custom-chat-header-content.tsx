'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

type CustomChatHeaderContentContextValue = {
  headerContent: ReactNode;
  setHeaderContent: (content: ReactNode) => void;
};

const CustomChatHeaderContentContext = createContext<CustomChatHeaderContentContextValue | null>(
  null,
);

export function CustomChatHeaderContentProvider({ children }: { children: ReactNode }) {
  const [headerContent, setHeaderContent] = useState<ReactNode>(null);

  const value = useMemo(
    () => ({
      headerContent,
      setHeaderContent,
    }),
    [headerContent],
  );

  return (
    <CustomChatHeaderContentContext.Provider value={value}>
      {children}
    </CustomChatHeaderContentContext.Provider>
  );
}

export function useCustomChatHeaderContent() {
  const context = useContext(CustomChatHeaderContentContext);

  if (!context) {
    throw new Error(
      'useCustomChatHeaderContent must be used within CustomChatHeaderContentProvider',
    );
  }

  return context;
}

export function CustomChatHeaderContent({ children }: { children: ReactNode }) {
  const { setHeaderContent } = useCustomChatHeaderContent();

  useEffect(() => {
    setHeaderContent(children);

    return () => {
      setHeaderContent(null);
    };
  }, [children, setHeaderContent]);

  return null;
}
