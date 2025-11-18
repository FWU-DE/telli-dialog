'use server';

import { auth } from '@/auth';
import { Session } from 'next-auth';

/**
 * Wrap a server action with authentication.
 * The wrapped function receives the Session as the first argument.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withAuth<Args extends any[], Return>(
  fn: (session: Session, ...args: Args) => Promise<Return>,
) {
  return async (...args: Args): Promise<Return> => {
    const session = await auth();

    if (!session) {
      throw new Error('Unauthorized');
    }

    return fn(session, ...args);
  };
}
