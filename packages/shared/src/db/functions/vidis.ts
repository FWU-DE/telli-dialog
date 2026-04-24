import { VidisUserInfo } from '../../auth/vidis';
import { db } from '..';
import { UserInsertModel, UserSchoolRole, userTable } from '../schema';
import { dbGetFederalStateById } from './federal-state';

function vidisRoleToUserSchoolRole(role: string): UserSchoolRole {
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

// TODO RL: Typ checken, sollte nicht optional sein
export async function dbCreateVidisUser(
  user: Pick<UserInsertModel, 'firstName' | 'lastName' | 'email'> & {
    id: string;
    schoolIds?: string[];
    federalStateId?: string;
    userRole?: UserSchoolRole;
  },
) {
  const values = {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    schoolIds: user.schoolIds ?? [],
    federalStateId: user.federalStateId ?? null,
    userRole: user.userRole ?? 'student',
  } as const;

  const insertedUser = await db
    .insert(userTable)
    .values(values)
    .onConflictDoUpdate({
      target: userTable.id,
      set: {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        schoolIds: values.schoolIds,
        federalStateId: values.federalStateId,
        userRole: values.userRole,
      },
    })
    .returning();
  return insertedUser;
}

export async function dbGetOrCreateVidisUser(userInfo: VidisUserInfo) {
  const federalState = await dbGetFederalStateById(userInfo.bundesland);

  if (!federalState) {
    throw new Error('Could not get federal state');
  }

  const schoolIds =
    typeof userInfo.schulkennung === 'string' ? [userInfo.schulkennung] : userInfo.schulkennung;
  const role = vidisRoleToUserSchoolRole(userInfo.rolle);

  return await db.transaction(async (tx) => {
    const insertedUser = (
      await tx
        .insert(userTable)
        .values({
          id: userInfo.sub,
          firstName: '',
          lastName: '',
          email: `${userInfo.sub}@vidis.schule`,
          schoolIds,
          federalStateId: federalState.id,
          userRole: role,
        })
        .onConflictDoUpdate({
          target: [userTable.id],
          set: {
            schoolIds,
            federalStateId: federalState.id,
            userRole: role,
          },
        })
        .returning()
    )[0];

    return { ...insertedUser, role };
  });
}
