import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';

function subscribe(callback: () => void) {
  // listen for event from `navigateWithoutRefresh`
  window.addEventListener('telli:pathnameChange', callback);
  // popstate is for back/forward navigation
  window.addEventListener('popstate', callback);

  return () => {
    window.removeEventListener('telli:pathnameChange', callback);
    window.removeEventListener('popstate', callback);
  };
}

export function useCustomPathname() {
  const nextPathname = usePathname();
  const locationPathname = useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => '', // Not supported on server
  );

  return locationPathname || nextPathname;
}
