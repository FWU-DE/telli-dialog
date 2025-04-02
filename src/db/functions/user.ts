import { eq } from 'drizzle-orm';
import { db } from '..';
import { userTable } from '../schema';
import { VERSION } from '@/components/modals/static_content';

export async function dbGetUserById({ userId }: { userId: string | undefined }) {
  if (userId === undefined) return undefined;

  const maybeUser = (await db.select().from(userTable).where(eq(userTable.id, userId)))[0];

  if (maybeUser === undefined) return undefined;

  const { ...obscuredUser } = maybeUser;

  return obscuredUser;
}
export async function dbUpdateLastUsedModelByUserId({
  modelName,
  userId,
}: {
  modelName: string;
  userId: string;
}) {
  const [updatedUser] = await db
    .update(userTable)
    .set({ lastUsedModel: modelName })
    .where(eq(userTable.id, userId))
    .returning();
  return updatedUser;
}

export async function dbUpdateUserTermsVersion({ userId }: { userId: string }) {
  const [updatedRow] = await db
    .update(userTable)
    .set({ versionAcceptedConditions: VERSION })
    .where(eq(userTable.id, userId))
    .returning();
  return updatedRow;
}
