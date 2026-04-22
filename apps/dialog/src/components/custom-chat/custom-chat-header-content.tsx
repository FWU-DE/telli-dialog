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

export function CustomChatHeaderContent({
  children,
  centered,
  isVisible,
}: {
  children: ReactNode;
  centered?: boolean;
  isVisible?: boolean;
}) {
  const { setHeaderContent } = useCustomChatHeaderContent();

  useEffect(() => {
    let content: ReactNode = children;

    if (isVisible !== undefined) {
      content = (
        <div
          className={`transition-opacity duration-200 ${
            isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden={!isVisible}
        >
          {content}
        </div>
      );
    }

    if (centered) {
      content = (
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">{content}</div>
      );
    }

    setHeaderContent(content);

    return () => {
      setHeaderContent(null);
    };
  }, [children, centered, isVisible, setHeaderContent]);

  return null;
}
