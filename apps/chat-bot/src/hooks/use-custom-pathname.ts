import { useSyncExternalStore, useEffect } from 'react';
import { usePathname } from 'next/navigation';

function subscribe(callback: () => void) {
  // listen for event from `navigateWithoutRefresh`
  window.addEventListener('ais-chat:pathnameChange', callback);
  // popstate is for back/forward navigation
  window.addEventListener('popstate', callback);

  return () => {
    window.removeEventListener('ais-chat:pathnameChange', callback);
    window.removeEventListener('popstate', callback);
  };
}

/**
 * We need this custom hook because Next.js's `usePathname` does not trigger
 * updates when the URL changes via `window.history` API (e.g., `navigateWithoutRefresh`).
 * This is needed when we start a new chat with the first message.
 * In this case a history item is created and should be selected automatically.
 * This is not the case if we use 'usePathname' from 'next/navigation' so we need the custom event here.
 * @returns The current pathname.
 */
export function useCustomPathname() {
  const nextPathname = usePathname();

  // When Next.js pathname changes (via Link, router.push, etc.),
  // dispatch an event to notify the external store subscribers
  useEffect(() => {
    window.dispatchEvent(new Event('ais-chat:pathnameChange'));
  }, [nextPathname]);

  const pathname = useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => nextPathname, // window.location.pathname is empty string on server, so we return nextPathname
  );

  return pathname;
}
