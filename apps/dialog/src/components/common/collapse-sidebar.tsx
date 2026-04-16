'use client';

import { useSidebar } from '@telli/ui/components/Sidebar';
import { useEffect } from 'react';

export default function CollapseSidebar() {
  const { setOpen } = useSidebar();

  useEffect(() => {
    setOpen(false);
  }, [setOpen]);

  return null;
}
