'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import { logDebug, logError, logWarning } from '@shared/logging';
import type { Session } from 'next-auth';

type ResilientSessionProviderProps = {
  children: React.ReactNode;
  session: Session | null;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
};

/**
 * Wrapper around NextAuth's SessionProvider that intercepts session fetch
 * requests and caches the last valid session to prevent logout on network errors.
 *
 * When the session endpoint fails (network error, 5xx), returns the cached
 * session instead of null, keeping NextAuth in 'authenticated' state so its
 * internal polling continues working.
 */
export default function ResilientSessionProvider({
  children,
  session,
  refetchInterval,
  refetchOnWindowFocus,
}: ResilientSessionProviderProps) {
  const lastValidSessionRef = useRef<Session | null>(session);
  const originalFetchRef = useRef<typeof fetch | null>(null);

  useEffect(() => {
    // Store original fetch if not already stored
    if (!originalFetchRef.current) {
      originalFetchRef.current = window.fetch;
    }

    const originalFetch = originalFetchRef.current;
    if (!originalFetch) {
      throw new Error('ResilientSessionProvider: original fetch not available');
    }

    // Intercept fetch for session endpoint
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

      // Only intercept session endpoint requests (exact match on pathname)
      const SESSION_ENDPOINT = '/api/auth/session';
      const isSessionEndpoint =
        url === SESSION_ENDPOINT ||
        new URL(url, window.location.origin).pathname === SESSION_ENDPOINT;

      if (!isSessionEndpoint) {
        return originalFetch(input, init);
      }

      try {
        const response = await originalFetch(input, init);

        // If successful, parse and cache the session
        if (response.ok) {
          const clonedResponse = response.clone();
          try {
            const data = await clonedResponse.json();

            if (data && typeof data === 'object' && Object.keys(data).length > 0) {
              // Valid session - cache it
              lastValidSessionRef.current = data as Session;
              logDebug('Session fetched successfully - cached');
            } else {
              // Genuine logout (empty session) - clear cache
              lastValidSessionRef.current = null;
              logDebug('Session cleared (genuine logout)');
            }
          } catch {
            // JSON parse error - ignore
          }
          return response;
        }

        // Non-OK response (4xx, 5xx) - infrastructure error
        logWarning('Session endpoint returned error status - using cached session', {
          status: response.status,
        });

        if (lastValidSessionRef.current) {
          // Return cached session to prevent logout
          return new Response(JSON.stringify(lastValidSessionRef.current), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // No cached session - allow the error
        return response;
      } catch (error) {
        // Network error (fetch failed)
        logError('Session endpoint unreachable - using cached session', error);

        if (lastValidSessionRef.current) {
          // Return cached session to prevent logout
          return new Response(JSON.stringify(lastValidSessionRef.current), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // No cached session - rethrow error
        throw error;
      }
    };

    // Cleanup: restore original fetch on unmount
    return () => {
      if (originalFetchRef.current) {
        window.fetch = originalFetchRef.current;
      }
    };
  }, []);

  return (
    <SessionProvider
      session={session}
      refetchInterval={refetchInterval}
      refetchOnWindowFocus={refetchOnWindowFocus}
    >
      {children}
    </SessionProvider>
  );
}
