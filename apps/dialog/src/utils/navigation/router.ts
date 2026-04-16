/**
 * Opens a URL in a new browser tab with secure defaults.
 */
export function openInNewTab(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Navigates to a new path without triggering a full page reload or component remount.
 * Using this function may lead to an out-of-sync router state. Prefer to use `useRouter` whenever possible.
 *
 * @see {@link https://nextjs.org/docs/app/getting-started/linking-and-navigating#native-history-api}
 *
 * @param path - The new URL path to navigate to.
 */
export function navigateWithoutRefresh(path: string) {
  window.history.replaceState(window.history.state, '', path);
  window.dispatchEvent(new Event('telli:pathnameChange'));
}
