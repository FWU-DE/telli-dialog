/**
 * @description Service functions for characters without authorization checks.
 */
import { db } from '@shared/db';
import { characterTable } from '@shared/db/schema';
import { addDays } from '@shared/utils/date';
import { and, eq, lt } from 'drizzle-orm';

/**
 * Cleans up characters with empty names from the database.
 *
 * CAUTION: This is an admin function that does not check any authorization!
 *
 * Note: linked files will be unlinked but removed separately by `dbDeleteDanglingFiles`
 *
 * @returns number of deleted characters in db.
 */
export async function cleanupCharacters() {
  const result = await db
    .delete(characterTable)
    .where(and(eq(characterTable.name, ''), lt(characterTable.createdAt, addDays(new Date(), -1))))
    .returning();
  return result.length;
}
