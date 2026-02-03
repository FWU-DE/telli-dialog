import { auth } from '@/auth';
import type { Session } from 'next-auth';
import * as Sentry from '@sentry/nextjs';
import { UnauthenticatedError } from '@shared/error';

// Type for a validated admin session with guaranteed user.name
export type ValidatedSession = Session & {
  user: NonNullable<Session['user']> & {
    name: string;
  };
};

/**
 * @returns The authenticated session with validated user information
 * @throws UnauthenticatedError if no session found or session is incomplete
 */
export async function requireAdminAuth(): Promise<ValidatedSession> {
  const session = await auth();
  if (!session?.user?.name) {
    throw new UnauthenticatedError('Authentication required or session incomplete');
  }

  // For audit-log reasons, we keep track of all available user information
  Sentry.setUser({
    id: session.user.id,
    email: session.user.email ?? undefined,
    username: session.user.name,
  });

  return session as ValidatedSession;
}
