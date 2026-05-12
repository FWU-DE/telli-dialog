/**
 * @description Service functions for assistants without authorization checks.
 */
import { db } from '@shared/db';
import { assistantTable } from '@shared/db/schema';
import { addDays } from '@shared/utils/date';
import { and, eq, lt } from 'drizzle-orm';

/**
 * Cleans up custom gpts with empty names from the database.
 *
 * CAUTION: This is an admin function that does not check any authorization!
 *
 * Note: linked files will be unlinked but removed separately by `dbDeleteDanglingFiles`
 *
 * @returns number of deleted custom gpts in db.
 */
export async function cleanupAssistants() {
  const result = await db
    .delete(assistantTable)
    .where(and(eq(assistantTable.name, ''), lt(assistantTable.createdAt, addDays(new Date(), -1))))
    .returning();
  return result.length;
}
