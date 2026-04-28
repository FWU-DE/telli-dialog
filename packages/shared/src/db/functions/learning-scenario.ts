import { and, desc, eq, getTableColumns, inArray, isNull, or, sql } from 'drizzle-orm';
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
} from '../schema';

/**
 * Returns a subquery that selects only the single latest non-expired share per learning scenario
 * for a given user.
 *
 * A share is expired if either:
 * - `manually_stopped_at IS NOT NULL` (explicitly stopped), or
 * - `started_at + maxUsageTimeLimit < now` (time limit elapsed; `manually_stopped_at` may still be NULL for these)
 *
 * When multiple non-expired rows exist, `DISTINCT ON (learning_scenario_id) ORDER BY started_at DESC`
 * ensures only the most-recent row is returned, preventing duplicate entity rows in JOINs.
 */
function latestActiveLearningScenarioShare(userId: string) {
  return db
    .selectDistinctOn([sharedLearningScenarioTable.learningScenarioId], {
      ...getTableColumns(sharedLearningScenarioTable),
    })
    .from(sharedLearningScenarioTable)
    .where(
      and(
        eq(sharedLearningScenarioTable.userId, userId),
        isNull(sharedLearningScenarioTable.manuallyStoppedAt),
        sql`${sharedLearningScenarioTable.startedAt} + ${sharedLearningScenarioTable.maxUsageTimeLimit} * interval '1 minute' >= now()`,
      ),
    )
    .orderBy(
      sharedLearningScenarioTable.learningScenarioId,
      desc(sharedLearningScenarioTable.startedAt),
    )
    .as('latest_active_ls_share');
}

function baseLearningScenarioWithShareQuery(
  activeShare: ReturnType<typeof latestActiveLearningScenarioShare>,
) {
  return db
    .select({
      ...getTableColumns(learningScenarioTable),
      telliPointsLimit: activeShare.telliPointsLimit,
      inviteCode: activeShare.inviteCode,
      maxUsageTimeLimit: activeShare.maxUsageTimeLimit,
      startedAt: activeShare.startedAt,
      manuallyStoppedAt: activeShare.manuallyStoppedAt,
      startedBy: activeShare.userId,
    })
    .from(learningScenarioTable);
}

export function dbGetGlobalLearningScenarios({
  userId,
  federalStateId,
}: {
  userId: string;
  federalStateId?: string;
}): Promise<LearningScenarioOptionalShareDataModel[]> {
  const activeShare = latestActiveLearningScenarioShare(userId);
  return baseLearningScenarioWithShareQuery(activeShare)
    .leftJoin(activeShare, eq(activeShare.learningScenarioId, learningScenarioTable.id))
    .leftJoin(
      learningScenarioTemplateMappingTable,
      eq(learningScenarioTemplateMappingTable.learningScenarioId, learningScenarioTable.id),
    )
    .where(
      and(
        eq(learningScenarioTable.accessLevel, 'global'),
        federalStateId
          ? eq(learningScenarioTemplateMappingTable.federalStateId, federalStateId)
          : undefined,
      ),
    )
    .orderBy(desc(learningScenarioTable.createdAt));
}

/**
 * Retrieves all learning scenarios associated with a specific school that are accessible to a user.
 *
 * This includes usage Data from the sharedLearningScenarioTable table.
 *
 * @param params.schoolId - The unique identifier of the school
 * @param params.userId - The unique identifier of the user requesting the learning scenarios
 * @returns A promise that resolves to an array of learning scenario models with associated sharing metadata
 */
export function dbGetLearningScenariosBySchoolId({
  schoolId,
  userId,
}: {
  schoolId: string;
  userId: string;
}): Promise<LearningScenarioOptionalShareDataModel[]> {
  const activeShare = latestActiveLearningScenarioShare(userId);
  return baseLearningScenarioWithShareQuery(activeShare)
    .leftJoin(activeShare, eq(activeShare.learningScenarioId, learningScenarioTable.id))
    .where(
      and(
        eq(learningScenarioTable.schoolId, schoolId),
        eq(learningScenarioTable.accessLevel, 'school'),
      ),
    )
    .orderBy(desc(learningScenarioTable.createdAt));
}

export async function dbGetLearningScenariosByUserId({
  userId,
}: {
  userId: string;
}): Promise<LearningScenarioOptionalShareDataModel[]> {
  const activeShare = latestActiveLearningScenarioShare(userId);
  return baseLearningScenarioWithShareQuery(activeShare)
    .leftJoin(activeShare, eq(activeShare.learningScenarioId, learningScenarioTable.id))
    .where(
      and(
        eq(learningScenarioTable.userId, userId),
        eq(learningScenarioTable.accessLevel, 'private'),
      ),
    )
    .orderBy(desc(learningScenarioTable.createdAt));
}

/**
 * Returns all learning scenarios created by the user regardless of access level
 * (private, school, or global).
 *
 * Contrast with {@link dbGetLearningScenariosByUserId}, which only returns private scenarios.
 */
export async function dbGetAllLearningScenariosByUserId({
  userId,
}: {
  userId: string;
}): Promise<LearningScenarioOptionalShareDataModel[]> {
  const activeShare = latestActiveLearningScenarioShare(userId);
  return baseLearningScenarioWithShareQuery(activeShare)
    .leftJoin(activeShare, eq(activeShare.learningScenarioId, learningScenarioTable.id))
    .where(eq(learningScenarioTable.userId, userId))
    .orderBy(desc(learningScenarioTable.createdAt));
}

export async function dbGetAllAccessibleLearningScenarios({
  userId,
  schoolId,
  federalStateId,
}: {
  userId: string;
  schoolId: string;
  federalStateId: string;
}): Promise<LearningScenarioOptionalShareDataModel[]> {
  const activeShare = latestActiveLearningScenarioShare(userId);
  return baseLearningScenarioWithShareQuery(activeShare)
    .leftJoin(activeShare, eq(activeShare.learningScenarioId, learningScenarioTable.id))
    .leftJoin(
      learningScenarioTemplateMappingTable,
      eq(learningScenarioTemplateMappingTable.learningScenarioId, learningScenarioTable.id),
    )
    .where(
      or(
        and(
          eq(learningScenarioTable.userId, userId),
          eq(learningScenarioTable.accessLevel, 'private'),
        ),
        and(
          eq(learningScenarioTable.schoolId, schoolId),
          eq(learningScenarioTable.accessLevel, 'school'),
        ),
        and(
          eq(learningScenarioTable.accessLevel, 'global'),
          eq(learningScenarioTemplateMappingTable.federalStateId, federalStateId),
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
  const [learningScenario] = await db
    .select()
    .from(learningScenarioTable)
    .where(eq(learningScenarioTable.id, learningScenarioId));
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
  userId,
}: {
  learningScenarioId: string;
  userId: string;
}): Promise<LearningScenarioWithShareDataModel | undefined> {
  const activeShare = latestActiveLearningScenarioShare(userId);
  const [row] = await baseLearningScenarioWithShareQuery(activeShare)
    .innerJoin(activeShare, eq(activeShare.learningScenarioId, learningScenarioTable.id))
    .where(eq(learningScenarioTable.id, learningScenarioId));
  return row;
}

export async function dbGetLearningScenarioByIdOptionalShareData({
  learningScenarioId,
  userId,
}: {
  learningScenarioId: string;
  userId: string;
}): Promise<LearningScenarioOptionalShareDataModel | undefined> {
  const activeShare = latestActiveLearningScenarioShare(userId);
  const [row] = await baseLearningScenarioWithShareQuery(activeShare)
    .leftJoin(activeShare, eq(activeShare.learningScenarioId, learningScenarioTable.id))
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
  const [row] = await db
    .select({
      ...getTableColumns(learningScenarioTable),
      telliPointsLimit: sharedLearningScenarioTable.telliPointsLimit,
      inviteCode: sharedLearningScenarioTable.inviteCode,
      maxUsageTimeLimit: sharedLearningScenarioTable.maxUsageTimeLimit,
      startedAt: sharedLearningScenarioTable.startedAt,
      manuallyStoppedAt: sharedLearningScenarioTable.manuallyStoppedAt,
      startedBy: sharedLearningScenarioTable.userId,
    })
    .from(learningScenarioTable)
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

export async function dbDeleteLearningScenarioByIdAndUserId({
  learningScenarioId,
  userId,
}: {
  learningScenarioId: string;
  userId: string;
}) {
  const [learningScenario] = await db
    .select()
    .from(learningScenarioTable)
    .where(
      and(
        eq(learningScenarioTable.id, learningScenarioId),
        eq(learningScenarioTable.userId, userId),
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
          eq(learningScenarioTable.userId, userId),
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
 * Returns all active (non-stopped, non-expired) shared learning scenarios for a given learning scenario and user.
 */
export function dbGetSharedLearningScenarioConversations({
  learningScenarioId,
  userId,
}: {
  learningScenarioId: string;
  userId: string;
}): Promise<SharedLearningScenarioSelectModel[]> {
  const activeShare = latestActiveLearningScenarioShare(userId);
  return db
    .select()
    .from(activeShare)
    .where(eq(activeShare.learningScenarioId, learningScenarioId));
}

/**
 * Create a new shared instance for a learning scenario.
 * Always inserts a new row; the caller is responsible for stopping any existing active share first.
 */
export async function dbCreateLearningScenarioShare({
  userId,
  learningScenarioId,
  telliPointsLimit,
  maxUsageTimeLimit,
  inviteCode,
  startedAt,
}: {
  userId: string;
  learningScenarioId: string;
  telliPointsLimit: number;
  maxUsageTimeLimit: number;
  inviteCode: string;
  startedAt: Date;
}) {
  const [newShare] = await db
    .insert(sharedLearningScenarioTable)
    .values({
      userId,
      learningScenarioId,
      maxUsageTimeLimit,
      telliPointsLimit,
      inviteCode,
      startedAt,
    })
    .returning();
  return newShare;
}
