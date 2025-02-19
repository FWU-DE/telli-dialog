import { useState, useEffect } from 'react';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../../tailwind.config';

const fullConfig = resolveConfig(tailwindConfig);
const breakpoints = fullConfig.theme.screens;

const getWindowWidth = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth;
  }
  return 0;
};

export default function useBreakpoints() {
  const [width, setWidth] = useState(getWindowWidth());

  useEffect(() => {
    const handleResize = () => {
      setWidth(getWindowWidth());
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isBelow = {} as Record<keyof typeof breakpoints, boolean>;
  const isAtLeast = {} as Record<keyof typeof breakpoints, boolean>;

  for (const [key, value] of Object.entries(breakpoints)) {
    isBelow[key as keyof typeof breakpoints] = width < parseInt(value, 10);
    isAtLeast[key as keyof typeof breakpoints] = width >= parseInt(value, 10);
  }

  return { width, isBelow, isAtLeast };
}
