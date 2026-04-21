'use client';

import { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import type { OverviewFilter } from '@shared/overview-filter';

type EntityType = 'characters' | 'learning-scenarios' | 'assistants';

const VALID_FILTERS: OverviewFilter[] = ['all', 'mine', 'official', 'school'];

function parseFilter(value: string | null): OverviewFilter | null {
  if (value && (VALID_FILTERS as string[]).includes(value)) {
    return value as OverviewFilter;
  }
  return null;
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
  const [filter, setFilterState] = useState<OverviewFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const onLoadRef = useRef(onLoad);
  const sessionStorageKey = `overview-filter-${entityType}`;

  useEffect(() => {
    onLoadRef.current = onLoad;
  });

  // Determine initial filter and perform initial load on mount
  useEffect(() => {
    let initialFilter: OverviewFilter = 'all';

    const stored = sessionStorage.getItem(sessionStorageKey);
    if (stored) {
      initialFilter = parseFilter(stored) ?? 'all';
    } else {
      // Legacy bookmark support: read URL param once on mount
      const urlFilter = parseFilter(new URLSearchParams(window.location.search).get('filter'));
      if (urlFilter) {
        initialFilter = urlFilter;
        sessionStorage.setItem(sessionStorageKey, initialFilter);
      }
    }

    startTransition(() => {
      setFilterState(initialFilter);
      setIsLoading(true);
    });
    onLoadRef.current(initialFilter).finally(() => startTransition(() => setIsLoading(false)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFilter = useCallback(
    async (newFilter: OverviewFilter) => {
      sessionStorage.setItem(sessionStorageKey, newFilter);
      setFilterState(newFilter);
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
