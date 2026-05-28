const listeners = new Set<() => void>();

let currentPathname = '';
let isInitialized = false;

function emitIfChanged(nextPathname: string) {
  if (currentPathname === nextPathname) {
    return;
  }

  currentPathname = nextPathname;
  listeners.forEach((listener) => {
    listener();
  });
}

function handlePopState() {
  emitIfChanged(window.location.pathname);
}

function ensureInitialized() {
  if (isInitialized || typeof window === 'undefined') {
    return;
  }

  currentPathname = window.location.pathname;
  window.addEventListener('popstate', handlePopState);
  isInitialized = true;
}

function cleanupIfUnused() {
  if (!isInitialized || listeners.size > 0 || typeof window === 'undefined') {
    return;
  }

  window.removeEventListener('popstate', handlePopState);
  isInitialized = false;
}

/**
 * Called after history updates that do not trigger Next.js router updates.
 */
export function notifyPathnameChanged() {
  if (typeof window === 'undefined') {
    return;
  }

  ensureInitialized();
  emitIfChanged(window.location.pathname);
  cleanupIfUnused();
}

/**
 * Keeps the shared pathname store in sync with Next.js pathname updates.
 */
export function syncPathnameWithNextPathname(pathname: string) {
  if (typeof window === 'undefined') {
    return;
  }

  ensureInitialized();

  // `usePathname` can lag behind native history updates (e.g. navigateWithoutRefresh).
  // Ignore stale values so a newly mounted hook instance cannot overwrite the current path.
  if (window.location.pathname !== pathname) {
    cleanupIfUnused();
    return;
  }

  emitIfChanged(pathname);
  cleanupIfUnused();
}

export function subscribeToPathnameStore(listener: () => void) {
  ensureInitialized();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    cleanupIfUnused();
  };
}

export function getPathnameSnapshot() {
  if (typeof window === 'undefined') {
    return '';
  }

  ensureInitialized();
  return currentPathname;
}
