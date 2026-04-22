import { VidisUserInfo } from '../../auth/vidis';
import { assignUserToSchools } from '../../users/user-school-assignment-service';
import {
  SchoolInsertModel,
  UserInsertModel,
  schoolTable,
  UserSchoolRole,
  userSchoolMappingTable,
  userTable,
} from '../schema';
import { PgTransactionObject } from '../types';
import { db } from '..';

export async function dbCreateVidisUser(user: UserInsertModel & { id: string }) {
  const insertedUser = await db
    .insert(userTable)
    .values({ ...user })
    .onConflictDoUpdate({ target: userTable.id, set: { ...user } })
    .returning();
  return insertedUser;
}

export async function dbGetOrCreateVidisUser(userInfo: VidisUserInfo) {
  // Business logic for user-school assignment has been moved to a service
  // This function now delegates to the service
  return await assignUserToSchools(userInfo);
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
