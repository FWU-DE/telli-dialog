'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

/**
 * Clears sessionStorage when the user logs in with a new session or logs out,
 * so that per-session state (e.g. dismissed info banners) resets correctly.
 *
 * Placed in the global layout so it also fires on logout, not only within
 * authenticated routes.
 */
export default function SessionClearer() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    try {
      const stored = sessionStorage.getItem('login_session_id');
      if (status === 'authenticated' && session?.sessionId) {
        if (stored !== session.sessionId) {
          sessionStorage.clear();
          sessionStorage.setItem('login_session_id', session.sessionId);
        }
      } else if (status === 'unauthenticated' && stored !== null) {
        sessionStorage.clear();
      }
    } catch {
      // Ignore storage failures.
    }
  }, [session?.sessionId, status]);

  return null;
}
