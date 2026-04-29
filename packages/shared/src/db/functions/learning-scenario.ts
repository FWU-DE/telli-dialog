import {
  and,
  arrayOverlaps,
  desc,
  eq,
  getTableColumns,
  inArray,
  isNull,
  or,
  sql,
} from 'drizzle-orm';
import { db } from '..';
import {
  conversationMessageTable,
  conversationTable,
  fileTable,
  LearningScenarioFileMapping,
  LearningScenarioOptionalShareDataModel,
  learningScenarioTable,
  learningScenarioTemplateMappingTable,
  LearningScenarioWithShareDataModel,
  SharedLearningScenarioSelectModel,
  sharedLearningScenarioTable,
  sharedLearningScenarioUsageTracking,
  SharedLearningScenarioUsageTrackingInsertModel,
  userTable,
} from '../schema';
import { generateInviteCode } from '@shared/sharing/generate-invite-code';
import { UserModel } from '@shared/auth/user-model';

function baseLearningScenarioQuery() {
  return db
    .select({
      ...getTableColumns(learningScenarioTable),
      ownerSchoolIds: sql<string[]>`coalesce(${userTable.schoolIds}, '{}'::text[])`,
    })
    .from(learningScenarioTable)
    .leftJoin(userTable, eq(learningScenarioTable.userId, userTable.id));
}

function baseLearningScenarioWithShareQuery() {
  return db
    .select({
      ...getTableColumns(learningScenarioTable),
      telliPointsLimit: sharedLearningScenarioTable.telliPointsLimit,
      inviteCode: sharedLearningScenarioTable.inviteCode,
      maxUsageTimeLimit: sharedLearningScenarioTable.maxUsageTimeLimit,
      startedAt: sharedLearningScenarioTable.startedAt,
      startedBy: sharedLearningScenarioTable.userId,
      ownerSchoolIds: sql<string[]>`coalesce(${userTable.schoolIds}, '{}'::text[])`,
    })
    .from(learningScenarioTable)
    .leftJoin(userTable, eq(learningScenarioTable.userId, userTable.id));
}

export function dbGetGlobalLearningScenarios({
  user,
}: {
  user: Pick<UserModel, 'id' | 'federalStateId'>;
}): Promise<LearningScenarioOptionalShareDataModel[]> {
  return baseLearningScenarioWithShareQuery()
    .leftJoin(
      sharedLearningScenarioTable,
      and(
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioTable.id),
        eq(sharedLearningScenarioTable.userId, user.id),
      ),
    )
    .leftJoin(
      learningScenarioTemplateMappingTable,
      eq(learningScenarioTemplateMappingTable.learningScenarioId, learningScenarioTable.id),
    )
    .where(
      and(
        eq(learningScenarioTable.accessLevel, 'global'),
        user.federalStateId
          ? eq(learningScenarioTemplateMappingTable.federalStateId, user.federalStateId)
          : undefined,
        or(
          eq(sharedLearningScenarioTable.userId, user.id),
          isNull(sharedLearningScenarioTable.userId),
        ),
      ),
    )
    .orderBy(desc(learningScenarioTable.createdAt));
}

/**
 * Retrieves all learning scenarios shared at the school level that are accessible to a user.
 *
 * This includes learning scenarios from other users who share at least one school with the requesting user.
 * This includes usage data from the sharedLearningScenarioTable table.
 *
 * @param params.userId - The unique identifier of the user requesting the learning scenarios
 * @returns A promise that resolves to an array of learning scenario models with associated sharing metadata
 */
export async function dbGetLearningScenariosByAssociatedSchools({
  user,
}: {
  user: Pick<UserModel, 'id' | 'schoolIds'>;
}): Promise<LearningScenarioOptionalShareDataModel[]> {
  // Get all users who share at least one school with the requesting user
  if (user.schoolIds.length === 0) {
    return [];
  }

  return baseLearningScenarioWithShareQuery()
    .leftJoin(
      sharedLearningScenarioTable,
      and(
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioTable.id),
        eq(sharedLearningScenarioTable.userId, user.id),
      ),
    )
    .where(
      and(
        eq(learningScenarioTable.accessLevel, 'school'),
        arrayOverlaps(userTable.schoolIds, user.schoolIds),
        or(
          eq(sharedLearningScenarioTable.userId, user.id),
          isNull(sharedLearningScenarioTable.userId),
        ),
      ),
    )
    .orderBy(desc(learningScenarioTable.createdAt));
}

export async function dbGetLearningScenariosByUser({
  user,
}: {
  user: Pick<UserModel, 'id'>;
}): Promise<LearningScenarioOptionalShareDataModel[]> {
  return baseLearningScenarioWithShareQuery()
    .leftJoin(
      sharedLearningScenarioTable,
      and(
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioTable.id),
        eq(sharedLearningScenarioTable.userId, user.id),
      ),
    )
    .where(
      and(
        eq(learningScenarioTable.userId, user.id),
        eq(learningScenarioTable.accessLevel, 'private'),
      ),
    )
    .orderBy(desc(learningScenarioTable.createdAt));
}

/**
 * Returns all learning scenarios created by the user regardless of access level
 * (private, school, or global).
 *
 * Contrast with {@link dbGetLearningScenariosByUser}, which only returns private scenarios.
 */
export async function dbGetAllLearningScenariosByUser({
  user,
}: {
  user: Pick<UserModel, 'id'>;
}): Promise<LearningScenarioOptionalShareDataModel[]> {
  return baseLearningScenarioWithShareQuery()
    .leftJoin(
      sharedLearningScenarioTable,
      and(
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioTable.id),
        eq(sharedLearningScenarioTable.userId, user.id),
      ),
    )
    .where(eq(learningScenarioTable.userId, user.id))
    .orderBy(desc(learningScenarioTable.createdAt));
}

export async function dbGetAllAccessibleLearningScenarios({
  user,
}: {
  user: Pick<UserModel, 'id' | 'schoolIds' | 'federalStateId'>;
}): Promise<LearningScenarioOptionalShareDataModel[]> {
  return baseLearningScenarioWithShareQuery()
    .leftJoin(
      sharedLearningScenarioTable,
      and(
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioTable.id),
        eq(sharedLearningScenarioTable.userId, user.id),
      ),
    )
    .leftJoin(
      learningScenarioTemplateMappingTable,
      eq(learningScenarioTemplateMappingTable.learningScenarioId, learningScenarioTable.id),
    )
    .where(
      or(
        and(
          eq(learningScenarioTable.userId, user.id),
          eq(learningScenarioTable.accessLevel, 'private'),
        ),
        user.schoolIds.length > 0
          ? and(
              eq(learningScenarioTable.accessLevel, 'school'),
              arrayOverlaps(userTable.schoolIds, user.schoolIds),
            )
          : undefined,
        and(
          eq(learningScenarioTable.accessLevel, 'global'),
          eq(learningScenarioTemplateMappingTable.federalStateId, user.federalStateId),
        ),
      ),
    )
    .orderBy(desc(learningScenarioTable.createdAt));
}

/**
 * The returned entity has no Shared Data attached.
 * Use `dbGetLearningScenarioByIdWithShareData` if you need shared data.
 */
export async function dbGetLearningScenarioById({
  learningScenarioId,
}: {
  learningScenarioId: string;
}) {
  const [learningScenario] = await baseLearningScenarioQuery().where(
    eq(learningScenarioTable.id, learningScenarioId),
  );
  return learningScenario;
}

/**
 * Needs userId because the metadata for shared learning scenarios is both tied to the user and learning scenario,
 * this is especially important for shared learning scenarios (school wide or global).
 *
 * Returns undefined if the learning scenario does not exist or is not shared by the user
 */
export async function dbGetLearningScenarioByIdWithShareData({
  learningScenarioId,
  user,
}: {
  learningScenarioId: string;
  user: Pick<UserModel, 'id'>;
}): Promise<LearningScenarioWithShareDataModel | undefined> {
  const [row] = await baseLearningScenarioWithShareQuery()
    .innerJoin(
      sharedLearningScenarioTable,
      and(
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioTable.id),
        eq(sharedLearningScenarioTable.userId, user.id),
      ),
    )
    .where(eq(learningScenarioTable.id, learningScenarioId));
  return row;
}

export async function dbGetLearningScenarioByIdOptionalShareData({
  learningScenarioId,
  user,
}: {
  learningScenarioId: string;
  user: Pick<UserModel, 'id'>;
}): Promise<LearningScenarioOptionalShareDataModel | undefined> {
  const [row] = await baseLearningScenarioWithShareQuery()
    .leftJoin(
      sharedLearningScenarioTable,
      and(
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioTable.id),
        eq(sharedLearningScenarioTable.userId, user.id),
      ),
    )
    .where(eq(learningScenarioTable.id, learningScenarioId));
  return row;
}

/**
 * Returns the share for a given learning scenario and user.
 */
export async function dbGetLearningScenarioByIdAndInviteCode({
  learningScenarioId,
  inviteCode,
}: {
  learningScenarioId: string;
  inviteCode: string;
}): Promise<LearningScenarioWithShareDataModel | undefined> {
  const [row] = await baseLearningScenarioWithShareQuery()
    .innerJoin(
      sharedLearningScenarioTable,
      and(
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioTable.id),
        eq(sharedLearningScenarioTable.inviteCode, inviteCode),
      ),
    )
    .where(eq(learningScenarioTable.id, learningScenarioId));

  return row;
}

export async function dbUpdateTokenUsageBySharedLearningScenarioId(
  value: SharedLearningScenarioUsageTrackingInsertModel,
) {
  const [insertedUsage] = await db
    .insert(sharedLearningScenarioUsageTracking)
    .values(value)
    .returning();
  if (insertedUsage === undefined) {
    throw new Error('Could not track the token usage');
  }

  return insertedUsage;
}

export async function dbDeleteLearningScenarioByIdAndUser({
  learningScenarioId,
  user,
}: {
  learningScenarioId: string;
  user: Pick<UserModel, 'id'>;
}) {
  const [learningScenario] = await baseLearningScenarioQuery().where(
    and(
      eq(learningScenarioTable.id, learningScenarioId),
      eq(learningScenarioTable.userId, user.id),
    ),
  );

  if (learningScenario === undefined) {
    throw new Error('Learning scenario does not exist');
  }

  const deletedLearningScenario = await db.transaction(async (tx) => {
    const relatedFiles = await tx
      .select({ id: LearningScenarioFileMapping.fileId })
      .from(LearningScenarioFileMapping)
      .where(eq(LearningScenarioFileMapping.learningScenarioId, learningScenario.id));

    const conversations = await tx
      .select({ id: conversationTable.id })
      .from(conversationTable)
      // TODO: customGptId is wrong! replace with learningScenarioId, once it's available
      .where(eq(conversationTable.assistantId, learningScenario.id));

    if (conversations.length > 0) {
      await tx.delete(conversationMessageTable).where(
        inArray(
          conversationMessageTable.conversationId,
          conversations.map((c) => c.id),
        ),
      );
    }
    // TODO: customGptId is wrong! replace with learningScenarioId, once it's available
    await tx
      .delete(conversationTable)
      .where(eq(conversationTable.assistantId, learningScenario.id));
    await tx
      .delete(LearningScenarioFileMapping)
      .where(eq(LearningScenarioFileMapping.learningScenarioId, learningScenario.id));
    await tx.delete(fileTable).where(
      inArray(
        fileTable.id,
        relatedFiles.map((f) => f.id),
      ),
    );
    const [deletedLearningScenario] = await tx
      .delete(learningScenarioTable)
      .where(
        and(
          eq(learningScenarioTable.id, learningScenarioId),
          eq(learningScenarioTable.userId, user.id),
        ),
      )
      .returning();

    if (deletedLearningScenario === undefined) {
      throw new Error('Could not delete learning scenario');
    }
    return deletedLearningScenario;
  });

  return deletedLearningScenario;
}

/**
 * Returns all shared learning scenarios for a given learning scenario and user.
 */
export function dbGetSharedLearningScenarioConversations({
  learningScenarioId,
  user,
}: {
  learningScenarioId: string;
  user: Pick<UserModel, 'id'>;
}): Promise<SharedLearningScenarioSelectModel[]> {
  return db
    .select()
    .from(sharedLearningScenarioTable)
    .where(
      and(
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioId),
        eq(sharedLearningScenarioTable.userId, user.id),
      ),
    );
}

/**
 * Create a new shared instance for a learning scenario.
 */
export async function dbCreateLearningScenarioShare({
  user,
  learningScenarioId,
  telliPointsLimit,
  maxUsageTimeLimit,
}: Omit<SharedLearningScenarioSelectModel, 'id' | 'userId'> & { user: Pick<UserModel, 'id'> }) {
  // share learning scenario instance
  const [maybeExistingEntry] = await db
    .select()
    .from(sharedLearningScenarioTable)
    .where(
      and(
        eq(sharedLearningScenarioTable.userId, user.id),
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioId),
      ),
    );

  const inviteCode = generateInviteCode();

  const startedAt = new Date();
  const [updatedSharedChat] = await db
    .insert(sharedLearningScenarioTable)
    .values({
      id: maybeExistingEntry?.id,
      userId: user.id,
      learningScenarioId,
      maxUsageTimeLimit,
      telliPointsLimit,
      inviteCode,
      startedAt,
    })
    .onConflictDoUpdate({
      target: sharedLearningScenarioTable.id,
      set: {
        inviteCode,
        maxUsageTimeLimit,
        telliPointsLimit,
        startedAt,
      },
    })
    .returning();
  return updatedSharedChat;
}
