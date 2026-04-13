'use client';

import React from 'react';
import { DesignConfiguration } from '@ui/types/design-configuration';
import { constructRootLayoutStyle } from '@/utils/tailwind/layout';
import { PortalContainerProvider } from '@ui/components/portal-container';

type ThemeContextType = {
  designConfiguration: DesignConfiguration;
};

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeProvider({
  children,
  designConfiguration,
}: {
  children: React.ReactNode;
  designConfiguration: DesignConfiguration;
}) {
  const [container, setContainer] = React.useState<HTMLElement | null>(null);

  return (
    <ThemeContext.Provider value={{ designConfiguration }}>
      <PortalContainerProvider container={container}>
        <div ref={setContainer} style={constructRootLayoutStyle({ designConfiguration })}>
          {children}
        </div>
      </PortalContainerProvider>
    </ThemeContext.Provider>
  );
}
