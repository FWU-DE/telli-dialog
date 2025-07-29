'use client';

import { useRouter } from 'next/navigation';
import React from 'react';

export default function Refresh() {
  const router = useRouter();

  React.useEffect(() => {
    router.refresh();
  }, [router]);

  return null;
}
