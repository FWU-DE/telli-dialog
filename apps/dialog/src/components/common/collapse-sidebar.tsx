'use client';

import {
  SIDEBAR_COOKIE_MAX_AGE,
  SIDEBAR_COOKIE_NAME,
  useSidebar,
} from '@telli/ui/components/Sidebar';
import { useEffect, useRef } from 'react';

/**
 * This component collapses the sidebar when mounted and restores its state when unmounted.
 * That is used for pages that are meant to be shared with students and the chat history
 * of the teacher should not be visible.
 */
export default function CollapseSidebar() {
  const { open, setOpen } = useSidebar();
  const originalOpenRef = useRef(open);
  const setOpenRef = useRef(setOpen);

  useEffect(() => {
    const originalOpen = originalOpenRef.current;
    const setOpenFn = setOpenRef.current;

    setOpenFn(false);
    // Restore the cookie so the forced collapse is not persisted across navigation
    document.cookie = `${SIDEBAR_COOKIE_NAME}=${String(originalOpen)}; path=/; max-age=${String(SIDEBAR_COOKIE_MAX_AGE)}`;

    return () => {
      // Restore the sidebar state when navigating away from this page
      setOpenFn(originalOpen);
    };
  }, []);

  return null;
}
