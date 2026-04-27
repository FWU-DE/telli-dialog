import { eq, sql } from 'drizzle-orm';
import { db } from '..';
import { userTable } from '../schema';

/**
 * Get all user IDs that share at least one school with the requesting user.
 * This is used to find entities with 'school' access level that should be visible to the requesting user.
 *
 * @param requestingUserId - The ID of the user making the request
 * @returns Array of user IDs that share schools with the requesting user
 */
export async function dbGetUserIdsWithSharedSchools(requestingUserId: string): Promise<string[]> {
  const requestingUser = await db
    .select({ schoolIds: userTable.schoolIds })
    .from(userTable)
    .where(eq(userTable.id, requestingUserId));

  const requestingUserRow = requestingUser[0];
  if (!requestingUserRow?.schoolIds?.length) {
    return [];
  }

  const userSchoolIds = requestingUserRow.schoolIds;

  // Find all users whose schoolIds array overlaps with the requesting user's schoolIds
  const users = await db
    .select({ id: userTable.id })
    .from(userTable)
    // Compare against scalar placeholders to avoid array-cast placeholder issues in some runtimes.
    .where(
      sql`EXISTS (
        SELECT 1
        FROM unnest(${userTable.schoolIds}) AS school_id
        WHERE school_id IN (${sql.join(
          userSchoolIds.map((schoolId) => sql`${schoolId}`),
          sql`, `,
        )})
      )`,
    );

  return users.map((user) => user.id);
}
