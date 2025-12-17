import { VidisUserInfo } from '../../auth/vidis';
import { db } from '..';
import {
  federalStateTable,
  UserInsertModel,
  SchoolInsertModel,
  schoolTable,
  userSchoolMappingTable,
  UserSchoolRole,
  userTable,
} from '../schema';
import { PgTransactionObject } from '../types';
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

export async function dbCreateVidisUser(user: UserInsertModel) {
  const insertedUser = await db
    .insert(userTable)
    .values({ ...user })
    .onConflictDoUpdate({ target: userTable.id, set: { ...user } })
    .returning();
  return insertedUser;
}

export async function dbGetOrCreateVidisUser(userInfo: VidisUserInfo) {
  const federalState = await dbGetFederalStateById(userInfo.bundesland);

  if (!federalState) {
    throw Error('Could not get federal state');
  }

  const schoolIds =
    typeof userInfo.schulkennung === 'string' ? [userInfo.schulkennung] : userInfo.schulkennung;

  const schools = await dbGetOrCreateSchools({
    schools: schoolIds.map((school) => ({ id: school, federalStateId: federalState.id })),
  });

  if (schools.length < 1) {
    throw Error('Could not insert school');
  }

  return await db.transaction(async (tx) => {
    const insertedUser = (
      await tx
        .insert(userTable)
        .values({
          id: userInfo.sub,
          firstName: '',
          lastName: '',
          email: `${userInfo.sub}@vidis.schule`,
        })
        .onConflictDoUpdate({ target: [userTable.id], set: { id: userInfo.sub } })
        .returning()
    )[0];

    const insertedSchoolMappings = await dbUpsertUserSchoolMappings(
      {
        schoolIds,
        role: vidisRoleToUserSchoolRole(userInfo.rolle),
        userId: userInfo.sub,
      },
      { dbObject: tx },
    );

    if (insertedSchoolMappings.length < 1) throw Error('Could not insert user');

    return { ...insertedUser, role: vidisRoleToUserSchoolRole(userInfo.rolle) };
  });
}

export async function dbGetOrCreateFederalState({ federalStateId }: { federalStateId: string }) {
  return (
    await db
      .insert(federalStateTable)
      .values({
        id: federalStateId,
        featureToggles: {
          isStudentAccessEnabled: true,
          isCharacterEnabled: true,
          isCustomGptEnabled: true,
          isSharedChatEnabled: true,
          isShareTemplateWithSchoolEnabled: true,
        },
      })
      .onConflictDoUpdate({ target: federalStateTable.id, set: { id: federalStateId } })
      .returning()
  )[0];
}

export async function dbGetOrCreateSchool({
  schoolId,
  federalStateId,
}: {
  schoolId: string;
  federalStateId: string;
}) {
  return (
    await db
      .insert(schoolTable)
      .values({ id: schoolId, federalStateId })
      .onConflictDoUpdate({ target: schoolTable.id, set: { id: schoolId } })
      .returning()
  )[0];
}

export async function dbGetOrCreateSchools({ schools }: { schools: SchoolInsertModel[] }) {
  const insertedSchools: SchoolInsertModel[] = [];
  for (const school of schools) {
    const insertedSchool = (
      await db
        .insert(schoolTable)
        .values(school)
        .onConflictDoUpdate({ target: [schoolTable.id], set: { id: school.id } })
        .returning()
    )[0];

    if (insertedSchool !== undefined) {
      insertedSchools.push(insertedSchool);
    }
  }

  return insertedSchools;
}

export async function dbUpsertUserSchoolMappings(
  {
    schoolIds,
    userId,
    role,
  }: {
    schoolIds: string[];
    userId: string;
    role: UserSchoolRole;
  },
  { dbObject }: { dbObject: PgTransactionObject },
) {
  const insertedMappings: string[] = [];

  for (const schoolId of schoolIds) {
    const insertedMapping = (
      await dbObject
        .insert(userSchoolMappingTable)
        .values({
          schoolId: schoolId,
          userId: userId,
          role: role,
        })
        .onConflictDoUpdate({
          target: [userSchoolMappingTable.schoolId, userSchoolMappingTable.userId],
          set: { schoolId },
        })
        .returning()
    )[0];

    if (insertedMapping !== undefined) {
      insertedMappings.push(insertedMapping.id);
    }
  }

  return insertedMappings;
}
