import { VidisUserInfo } from '../auth/vidis';
import { dbGetFederalStateById } from '../db/functions/federal-state';
import { db } from '../db';
import { and, eq, notInArray } from 'drizzle-orm';
import { UserSchoolRole, schoolTable, userSchoolMappingTable, userTable } from '../db/schema';

/**
 * Map VIDIS role codes to our internal UserSchoolRole type
 */
export function mapVidisRoleToUserSchoolRole(vidisRole: string): UserSchoolRole {
  switch (vidisRole) {
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

/**
 * Normalize schulkennung to an array of school IDs
 */
export function normalizeSchoolIds(schulkennung: string | string[]): string[] {
  return typeof schulkennung === 'string' ? [schulkennung] : schulkennung;
}

/**
 * Assigns or updates a user with schools based on IDP information.
 *
 * This service handles the business logic for user-school assignment during login:
 * 1. Validates that the federal state exists
 * 2. Creates schools if they don't exist (linked to the federal state)
 * 3. Creates or updates the user
 * 4. Creates or updates user-school mappings with the user's role
 *
 * @param userInfo - The user information from the IDP (VIDIS)
 * @returns The created/updated user with their role
 * @throws Error if federal state doesn't exist or if user/school creation fails
 */
export async function assignUserToSchools(userInfo: VidisUserInfo) {
  // Get the federal state - must exist, otherwise throw error
  const federalState = await dbGetFederalStateById(userInfo.bundesland);
  if (!federalState) {
    throw new Error(`Federal state not found: ${userInfo.bundesland}`);
  }

  // Normalize school IDs
  const schoolIds = normalizeSchoolIds(userInfo.schulkennung);
  if (schoolIds.length === 0) {
    throw new Error('No schools provided by identity provider');
  }

  // Execute user creation/update and school mappings in a transaction
  return await db.transaction(async (tx) => {
    // Bulk-insert schools; skip rows that already exist.
    await tx
      .insert(schoolTable)
      .values(schoolIds.map((id) => ({ id, federalStateId: federalState.id })))
      .onConflictDoNothing();

    // Insert user if not exists; retrieve existing user otherwise.
    let user = (
      await tx
        .insert(userTable)
        .values({
          id: userInfo.sub,
          firstName: '',
          lastName: '',
          email: `${userInfo.sub}@vidis.schule`,
        })
        .onConflictDoNothing()
        .returning()
    )[0];

    if (!user) {
      [user] = await tx.select().from(userTable).where(eq(userTable.id, userInfo.sub));
    }

    if (!user) {
      throw new Error('Could not create or retrieve user');
    }

    const userRole = mapVidisRoleToUserSchoolRole(userInfo.rolle);

    // Bulk-insert mappings; we assume that role cannot change, so skip on conflict.
    await tx
      .insert(userSchoolMappingTable)
      .values(schoolIds.map((schoolId) => ({ schoolId, userId: userInfo.sub, role: userRole })))
      .onConflictDoNothing();

    // Keep mappings in sync with IDP: remove user-school links no longer returned.
    await tx
      .delete(userSchoolMappingTable)
      .where(
        and(
          eq(userSchoolMappingTable.userId, userInfo.sub),
          notInArray(userSchoolMappingTable.schoolId, schoolIds),
        ),
      );

    return { ...user, role: userRole };
  });
}

// TODO: TD-1132 - Add placeholder for character-school assignment
// When implementing, add logic here to handle character access at school level
// export async function assignCharacterToSchool(...) { }

// TODO: TD-1132 - Add placeholder for assistant-school assignment
// When implementing, add logic here to handle assistant access at school level
// export async function assignAssistantToSchool(...) { }

// TODO: TD-1132 - Add placeholder for learning scenario-school assignment
// When implementing, add logic here to handle learning scenario access at school level
// export async function assignLearningScenarioToSchool(...) { }
