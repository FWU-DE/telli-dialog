'use client';

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type SessionWatcherProps = {
  /**
   * If set and the session status becomes "unauthenticated", user will be redirected here.
   */
  redirectTo: string;
  /**
   * The OIDC session ID of the current login. When it changes (new login), sessionStorage
   * is cleared so the per-session state (e.g., dismissed info banners) resets for the new session.
   */
  loginSessionId?: string;
  children: React.ReactNode;
};

/**
 * Client component that watches next-auth session state and redirects
 * to logout-callback url if user is unauthenticated.
 */
export default function SessionWatcher({
  redirectTo,
  loginSessionId,
  children,
}: SessionWatcherProps) {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (!loginSessionId) return;
    try {
      const stored = sessionStorage.getItem('login_session_id');
      if (stored !== loginSessionId) {
        sessionStorage.clear();
        sessionStorage.setItem('login_session_id', loginSessionId);
      }
    } catch {
      // Ignore storage failures.
    }
  }, [loginSessionId]);

  useEffect(() => {
    if (status === 'unauthenticated' && redirectTo) {
      router.push(redirectTo);
    }
  }, [session, status, redirectTo, router]);

  return <>{children}</>;
}
