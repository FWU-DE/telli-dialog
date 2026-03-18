'use client';

import { useCallback, useEffect, useRef } from 'react';

type NavigationIntent = () => void;

type UsePendingChangesGuardProps = {
  hasPendingChanges: boolean;
  onSaveBeforeLeave: () => Promise<void>;
};

const HISTORY_GUARD_STATE_KEY = '__pendingChangesGuard';

export function usePendingChangesGuard({
  hasPendingChanges,
  onSaveBeforeLeave,
}: UsePendingChangesGuardProps) {
  const hasPendingChangesRef = useRef(hasPendingChanges);
  const pendingIntentRef = useRef<NavigationIntent | null>(null);
  const bypassNextPopstateRef = useRef(false);
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    hasPendingChangesRef.current = hasPendingChanges;
  }, [hasPendingChanges]);

  const continueNavigation = useCallback(() => {
    const navigationIntent = pendingIntentRef.current;
    pendingIntentRef.current = null;
    navigationIntent?.();
  }, []);

  const navigateWithPendingChanges = useCallback(
    async (navigationIntent: NavigationIntent) => {
      if (isNavigatingRef.current) {
        return;
      }

      isNavigatingRef.current = true;
      pendingIntentRef.current = navigationIntent;

      try {
        await onSaveBeforeLeave();
      } finally {
        isNavigatingRef.current = false;
        continueNavigation();
      }
    },
    [continueNavigation, onSaveBeforeLeave],
  );

  const guardNavigation = useCallback(
    (navigationIntent: NavigationIntent) => {
      if (!hasPendingChangesRef.current) {
        navigationIntent();
        return;
      }

      void navigateWithPendingChanges(navigationIntent);
    },
    [navigateWithPendingChanges],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!window.history.state?.[HISTORY_GUARD_STATE_KEY]) {
      window.history.pushState({ [HISTORY_GUARD_STATE_KEY]: true }, '', window.location.href);
    }

    const onPopState = () => {
      if (bypassNextPopstateRef.current) {
        bypassNextPopstateRef.current = false;
        return;
      }

      if (!hasPendingChangesRef.current) {
        return;
      }

      window.history.pushState({ [HISTORY_GUARD_STATE_KEY]: true }, '', window.location.href);
      void navigateWithPendingChanges(() => {
        bypassNextPopstateRef.current = true;
        window.history.back();
      });
    };

    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
    };
  }, [navigateWithPendingChanges]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasPendingChangesRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  return {
    guardNavigation,
  };
}
