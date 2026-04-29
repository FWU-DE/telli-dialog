import { VidisUserInfo } from '../../auth/vidis';
import { eq } from 'drizzle-orm';
import { db } from '..';
import { UserInsertModel, UserSchoolRole, userTable } from '../schema';

export function vidisRoleToUserSchoolRole(role: string): UserSchoolRole {
  switch (role) {
    case 'LEHR':
      return 'teacher';
    case 'LERN':
      return 'student';
    case 'LEIT':
      return 'teacher';
    default:
      return 'student';
  }
}

export function normalizeVidisSchoolIds(schulkennung: VidisUserInfo['schulkennung']): string[] {
  const schoolIds = typeof schulkennung === 'string' ? [schulkennung] : schulkennung;
  return schoolIds.map((schoolId) => schoolId.trim()).filter((schoolId) => schoolId.length > 0);
}

export async function dbCreateVidisUser(
  user: Pick<UserInsertModel, 'firstName' | 'lastName' | 'email'> & {
    id: string;
    schoolIds: string[];
    federalStateId: string;
    userRole: UserSchoolRole;
  },
) {
  const [insertedUser] = await db.insert(userTable).values(user).returning();
  return insertedUser;
}

export async function dbUpdateVidisUserById(
  user: Pick<UserInsertModel, 'firstName' | 'lastName' | 'email'> & {
    id: string;
    schoolIds: string[];
    federalStateId: string;
    userRole: UserSchoolRole;
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

export async function dbCreateOrUpdateVidisUser(
  user: Pick<UserInsertModel, 'firstName' | 'lastName' | 'email'> & {
    id: string;
    schoolIds: string[];
    federalStateId: string;
    userRole: UserSchoolRole;
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
