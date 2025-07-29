'use client';

import React from 'react';
import { createPortal } from 'react-dom';

export const HEADER_PORTAL_ID = 'header-portal';

export default function HeaderPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const [headerElement, setHeaderElement] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const maybeHeaderPortal = document.getElementById(HEADER_PORTAL_ID);
    if (maybeHeaderPortal !== null) {
      setHeaderElement(maybeHeaderPortal);
    }
    setMounted(true);
  }, []);

  return mounted && headerElement ? createPortal(children, headerElement) : null;
}
