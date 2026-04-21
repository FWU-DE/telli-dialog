'use client';

import React, { startTransition } from 'react';
import { createPortal } from 'react-dom';

export const HEADER_PORTAL_ID = 'header-portal';

export default function HeaderPortal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = React.useState(false);
  const [headerElement, setHeaderElement] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    const maybeHeaderPortal = document.getElementById(HEADER_PORTAL_ID);
    startTransition(() => {
      if (maybeHeaderPortal !== null) {
        setHeaderElement(maybeHeaderPortal);
      }
      setMounted(true);
    });
  }, []);

  React.useEffect(() => {
    if (!headerElement || !className) return;

    const classes = className.trim().split(/\s+/).filter(Boolean);
    classes.forEach((cls) => headerElement.classList.add(cls));

    return () => {
      classes.forEach((cls) => headerElement.classList.remove(cls));
    };
  }, [headerElement, className]);

  return mounted && headerElement ? createPortal(children, headerElement) : null;
}
