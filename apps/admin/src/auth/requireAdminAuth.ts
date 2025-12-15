import { auth } from '@/auth';
import type { Session } from 'next-auth';

// TODO: Replace with shared error class when available
export class UnauthenticatedError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthenticatedError';
  }
}

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
  return session as ValidatedSession;
}
