'use client';

import React from 'react';
import { DesignConfiguration } from '@ui/types/design-configuration';
import { constructRootLayoutStyle } from '@/utils/tailwind/layout';

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
  return (
    <ThemeContext.Provider value={{ designConfiguration }}>
      <main style={constructRootLayoutStyle({ designConfiguration })} className="h-full">
        {children}
      </main>
    </ThemeContext.Provider>
  );
}
