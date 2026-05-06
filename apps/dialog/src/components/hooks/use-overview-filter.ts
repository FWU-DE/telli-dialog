'use client';

import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import type { OverviewFilter } from '@shared/overview-filter';
import { overviewFilterSchema } from '@shared/overview-filter';

type EntityType = 'characters' | 'learning-scenarios' | 'assistants';

function parseFilter(value: string | null): OverviewFilter | null {
  const result = overviewFilterSchema.safeParse(value);
  return result.success ? result.data : null;
}

function resolveInitialFilter(sessionStorageKey: string): OverviewFilter {
  const stored = sessionStorage.getItem(sessionStorageKey);
  if (stored) {
    return parseFilter(stored) ?? 'all';
  }
  // Legacy bookmark support: read URL param once on mount
  const urlFilter = parseFilter(new URLSearchParams(window.location.search).get('filter'));
  if (urlFilter) {
    sessionStorage.setItem(sessionStorageKey, urlFilter);
    return urlFilter;
  }
  return 'all';
}

/**
 * Hook to manage overview filter state using session storage.
 * Calls onLoad on mount with the initial filter (from session storage or legacy URL param).
 * Supports legacy URL params for backward compatibility with old bookmarks.
 *
 * @param entityType - The type of entity
 * @param onLoad - Callback to fetch entities for a given filter (called on mount and on change)
 * @returns [filter, setFilter, isLoading]
 */
export function useOverviewFilter(
  entityType: EntityType,
  onLoad: (filter: OverviewFilter) => Promise<void>,
): [OverviewFilter, (filter: OverviewFilter) => Promise<void>, boolean] {
  const sessionStorageKey = `overview-filter-${entityType}`;
  // useSyncExternalStore provides the sessionStorage value synchronously on the client
  // and 'all' as a server snapshot, preventing SSR crashes without hydration mismatches.
  const sessionStorageFilter = useSyncExternalStore<OverviewFilter>(
    () => () => {},
    () => resolveInitialFilter(sessionStorageKey),
    () => 'all',
  );
  // manualFilter holds user-initiated changes; null means "use sessionStorageFilter"
  const [manualFilter, setManualFilter] = useState<OverviewFilter | null>(null);
  const filter = manualFilter ?? sessionStorageFilter;
  const [isLoading, setIsLoading] = useState(true);
  const onLoadRef = useRef(onLoad);

  useEffect(() => {
    onLoadRef.current = onLoad;
  });

  // Perform initial load on mount
  useEffect(() => {
    onLoadRef.current(filter).finally(() => startTransition(() => setIsLoading(false)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFilter = useCallback(
    async (newFilter: OverviewFilter) => {
      sessionStorage.setItem(sessionStorageKey, newFilter);
      setManualFilter(newFilter);
      setIsLoading(true);
      try {
        await onLoadRef.current(newFilter);
      } finally {
        setIsLoading(false);
      }
    },
    [sessionStorageKey],
  );

  return [filter, setFilter, isLoading];
}
