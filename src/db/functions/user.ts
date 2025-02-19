import { eq } from 'drizzle-orm';
import { db } from '..';
import { userTable } from '../schema';

export async function dbGetUserById({ userId }: { userId: string | undefined }) {
  if (userId === undefined) return undefined;

  const maybeUser = (await db.select().from(userTable).where(eq(userTable.id, userId)))[0];

  if (maybeUser === undefined) return undefined;

  const { ...obscuredUser } = maybeUser;

  return obscuredUser;
}
