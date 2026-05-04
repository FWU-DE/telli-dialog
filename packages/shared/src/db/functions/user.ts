import { eq } from 'drizzle-orm';
import { db } from '..';
import { UserInsertModel, UserRole, userTable } from '../schema';

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

export async function dbUpdateUserTermsVersion({
  userId,
  versionAcceptedConditions,
}: {
  userId: string;
  versionAcceptedConditions: number;
}) {
  const [updatedRow] = await db
    .update(userTable)
    .set({ versionAcceptedConditions: versionAcceptedConditions })
    .where(eq(userTable.id, userId))
    .returning();
  return updatedRow;
}

export async function dbCreateUser(
  user: Pick<UserInsertModel, 'firstName' | 'lastName' | 'email'> & {
    id: string;
    schoolIds: string[];
    federalStateId: string;
    userRole: UserRole;
  },
) {
  const [insertedUser] = await db.insert(userTable).values(user).returning();
  return insertedUser;
}

export async function dbUpdateUserById(
  user: Pick<UserInsertModel, 'firstName' | 'lastName' | 'email'> & {
    id: string;
    schoolIds: string[];
    federalStateId: string;
    userRole: UserRole;
  },
) {
  const [updatedUser] = await db
    .update(userTable)
    .set({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      schoolIds: user.schoolIds,
      federalStateId: user.federalStateId,
      userRole: user.userRole,
    })
    .where(eq(userTable.id, user.id))
    .returning();

  return updatedUser;
}

export async function dbCreateOrUpdateUser(
  user: Pick<UserInsertModel, 'firstName' | 'lastName' | 'email'> & {
    id: string;
    schoolIds: string[];
    federalStateId: string;
    userRole: UserRole;
  },
) {
  const insertedUser = await db
    .insert(userTable)
    .values(user)
    .onConflictDoUpdate({
      target: userTable.id,
      set: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        schoolIds: user.schoolIds,
        federalStateId: user.federalStateId,
        userRole: user.userRole,
      },
    })
    .returning();
  return insertedUser;
}
