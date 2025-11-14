import { type Session } from 'next-auth';
import { redirect } from 'next/navigation';
import { auth, unstable_update } from '.';
import { type UserAndContext } from './types';
import { dbGetSchoolAndMappingAndFederalStateByUserId } from '@shared/db/functions/school';
import { FederalStateSelectModel } from '@shared/db/schema';

export async function getValidSession(): Promise<Session> {
  const session = await auth();

  if (session === null) {
    redirect('/login');
  }

  return session;
}

export async function getMaybeSession(): Promise<Session | null> {
  const session = await auth();

  return session;
}

export async function getMaybeUser() {
  const session = await auth();
  const user = session?.user;

  if (user === undefined) return null;

  return user;
}

export async function getUser(): Promise<UserAndContext> {
  const session = await getValidSession();

  if (session.user === undefined) {
    redirect('/logout');
  }

  return session.user;
}

export async function userHasCompletedTraining(): Promise<boolean> {
  const session = await getMaybeSession();
  return session?.hasCompletedTraining ?? false;
}

export async function updateSession(
  data?: Partial<
    | Session
    | {
        user: Partial<Session['user']>;
      }
  >,
): Promise<void> {
  await unstable_update(data ?? {});
}

export async function getUserAndContextByUserId({
  userId,
}: {
  userId: string;
}): Promise<UserAndContext> {
  const userAndContext = await dbGetSchoolAndMappingAndFederalStateByUserId({
    userId,
  });

  if (userAndContext === undefined) {
    throw Error('Could not extract the school and federal state for the user');
  }

  return {
    ...userAndContext.user,
    ...userAndContext,
    federalState: obscureFederalState(userAndContext.federalState),
    hasApiKeyAssigned: !!userAndContext.federalState.encryptedApiKey,
  };
}

function obscureFederalState(federalState: FederalStateSelectModel) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { encryptedApiKey, ...rest } = federalState;

  return rest;
}
export type ObscuredFederalState = ReturnType<Awaited<typeof obscureFederalState>>;
