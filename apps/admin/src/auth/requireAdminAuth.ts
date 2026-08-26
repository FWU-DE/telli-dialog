import { auth } from '@/auth';
import type { Session } from 'next-auth';
import * as Sentry from '@sentry/nextjs';
import { ForbiddenError, UnauthenticatedError } from '@shared/error';
import { AdminRole, canAccessAdminArea, canAccessEditorArea } from './roles';

// Type for a validated admin session with guaranteed user.name
export type ValidatedSession = Session & {
  user: NonNullable<Session['user']> & {
    name: string;
  };
  adminRole?: AdminRole;
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
  if (!canAccessAdminArea(session.adminRole)) {
    throw new ForbiddenError('The Admin role is required');
  }

  // For audit-log reasons, we keep track of all available user information
  Sentry.setUser({
    id: session.user.id,
    email: session.user.email ?? undefined,
    username: session.user.name,
  });

  return session as ValidatedSession;
}

export async function requireAdminAppAccess(): Promise<ValidatedSession> {
  const session = await auth();
  if (!session?.user?.name) {
    throw new UnauthenticatedError('Authentication required or session incomplete');
  }
  if (!canAccessEditorArea(session.adminRole)) {
    throw new ForbiddenError('The Editor role is required');
  }

  Sentry.setUser({
    id: session.user.id,
    email: session.user.email ?? undefined,
    username: session.user.name,
  });

  return session as ValidatedSession;
}
