'use client';

import { useEffect } from 'react';

/**
 * Hook that forces a page reload when the user navigates back to it using the browser's back button.
 * This is  useful for pages that have forms with input fields.
 * Otherwise old values are shown in the fields when the user goes back to the page.
 */
export function useForceReloadOnBrowserBackButton(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.history.pushState({ marker: 'forward' }, '');

    const handlePopState = (event: PopStateEvent) => {
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
