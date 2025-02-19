import { eq } from 'drizzle-orm';
import { db } from '..';
import { federalStateTable, schoolTable, userSchoolMappingTable, userTable } from '../schema';

export async function dbGetSchoolAndMappingAndFederalStateByUserId({ userId }: { userId: string }) {
  const [result] = await db
    .select()
    .from(userTable)
    .innerJoin(userSchoolMappingTable, eq(userSchoolMappingTable.userId, userTable.id))
    .innerJoin(schoolTable, eq(schoolTable.id, userSchoolMappingTable.schoolId))
    .innerJoin(federalStateTable, eq(federalStateTable.id, schoolTable.federalStateId))
    .where(eq(userTable.id, userId));

  if (result === undefined) return undefined;

  return {
    user: result.user_entity,
    school: { ...result.school, userRole: result.user_school_mapping.role },
    federalState: result.federal_state,
  };
}
