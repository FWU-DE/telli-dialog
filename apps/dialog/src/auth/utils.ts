import { type Session } from 'next-auth';
import { redirect } from 'next/navigation';
import { auth } from '.';
import { dbGetUserById } from '@/db/functions/user';
import { type UserAndContext } from './types';
import { dbGetSchoolAndMappingAndFederalStateByUserId } from '@/db/functions/school';
import { FederalStateModel } from '@/db/schema';

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

  const dbUser = await dbGetUserById({ userId: user.id });

  if (dbUser === undefined || dbUser.id === undefined) return null;
  const userAndContext = await getUserAndContextByUserId({ userId: dbUser.id });
  return userAndContext;
}

export async function getUser(): Promise<UserAndContext> {
  const session = await getValidSession();
  const user = session.user;

  if (user?.id === undefined) {
    redirect('/logout');
  }

  const userAndContext = await getUserAndContextByUserId({ userId: user.id });

  return userAndContext;
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
  };
}

function obscureFederalState(federalState: FederalStateModel) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { encryptedApiKey, ...rest } = federalState;

  return rest;
}
export type ObscuredFederalState = ReturnType<Awaited<typeof obscureFederalState>>;
