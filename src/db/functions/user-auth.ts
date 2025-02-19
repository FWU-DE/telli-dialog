import { eq } from 'drizzle-orm';
import { db } from '..';
import { userTable } from '../schema';

export async function dbGetUserByEmailAndPassword({
  email,
  // password,
}: {
  email: string;
  // password: string;
}) {
  const userRows = await db.select().from(userTable).where(eq(userTable.email, email));
  const maybeUser = userRows[0];

  if (!maybeUser) {
    return undefined;
  }

  // const passwordVerified = await verifyPassword(password, maybeUser.passwordHash);
  // if (!passwordVerified) {
  //   return undefined;
  // }

  return maybeUser;
}
