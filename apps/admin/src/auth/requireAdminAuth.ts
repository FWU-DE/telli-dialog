import { auth } from '../app/api/auth/[...nextauth]/auth';

// TODO: Replace with shared error class when available
export class UnauthenticatedError extends Error {
  constructor(message = 'Authentication required') {
    super(message);
    this.name = 'UnauthenticatedError';
  }
}

/**
 * @returns The authenticated session
 * @throws UnauthenticatedError if no session found
 */
export async function requireAdminAuth() {
  const session = await auth();
  if (!session) throw new UnauthenticatedError();
  return session;
}
