'use client';

import { useEffect } from 'react';

export function useForceReloadOnBrowserBackButton(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Markiere aktuellen State
    window.history.pushState({ marker: 'forward' }, '');

    const handlePopState = (event: PopStateEvent) => {
      // Wenn kein Marker → wir kommen von "zurück"
      if (!event.state || event.state.marker !== 'forward') {
        window.location.reload();
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);
}
