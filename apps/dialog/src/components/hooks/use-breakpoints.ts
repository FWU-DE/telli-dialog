import { useState, useEffect } from 'react';

// That is original definition of breakpoints with tailwindcss v3.
// In future we should use helper variables from tailwind directly and get rid of this file.
export const breakpoints = {
  xs: '480px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

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

    // Update width immediately on mount to get the correct client-side value
    handleResize();

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
