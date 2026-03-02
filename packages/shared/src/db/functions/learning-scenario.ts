import { and, desc, eq, getTableColumns, inArray, isNull, or } from 'drizzle-orm';
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
import { generateInviteCode } from '@shared/sharing/generate-invite-code';

function baseLearningScenarioWithShareQuery() {
  return db
    .select({
      ...getTableColumns(learningScenarioTable),
      telliPointsLimit: sharedLearningScenarioTable.telliPointsLimit,
      inviteCode: sharedLearningScenarioTable.inviteCode,
      maxUsageTimeLimit: sharedLearningScenarioTable.maxUsageTimeLimit,
      startedAt: sharedLearningScenarioTable.startedAt,
      startedBy: sharedLearningScenarioTable.userId,
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
  return baseLearningScenarioWithShareQuery()
    .leftJoin(
      sharedLearningScenarioTable,
      and(
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioTable.id),
        eq(sharedLearningScenarioTable.userId, userId),
      ),
    )
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
        or(
          eq(sharedLearningScenarioTable.userId, userId),
          isNull(sharedLearningScenarioTable.userId),
        ),
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
  return baseLearningScenarioWithShareQuery()
    .leftJoin(
      sharedLearningScenarioTable,
      and(
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioTable.id),
        eq(sharedLearningScenarioTable.userId, userId), // this ensures we get the user-specific shared data, or null if not shared by this user
      ),
    )
    .where(
      and(
        eq(learningScenarioTable.schoolId, schoolId),
        eq(learningScenarioTable.accessLevel, 'school'),
        or(
          eq(sharedLearningScenarioTable.userId, userId),
          isNull(sharedLearningScenarioTable.userId),
        ),
      ),
    )
    .orderBy(desc(learningScenarioTable.createdAt));
}

export async function dbGetLearningScenariosByUserId({
  userId,
}: {
  userId: string;
}): Promise<LearningScenarioOptionalShareDataModel[]> {
  return baseLearningScenarioWithShareQuery()
    .leftJoin(
      sharedLearningScenarioTable,
      and(
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioTable.id),
        eq(sharedLearningScenarioTable.userId, userId),
      ),
    )
    .where(
      and(
        eq(learningScenarioTable.userId, userId),
        eq(learningScenarioTable.accessLevel, 'private'),
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
  const [row] = await baseLearningScenarioWithShareQuery()
    .innerJoin(
      sharedLearningScenarioTable,
      and(
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioTable.id),
        eq(sharedLearningScenarioTable.userId, userId),
      ),
    )
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
  const [row] = await baseLearningScenarioWithShareQuery()
    .leftJoin(
      sharedLearningScenarioTable,
      and(
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioTable.id),
        eq(sharedLearningScenarioTable.userId, userId),
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
    throw Error('Could not track the token usage');
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
    throw Error('Learning scenario does not exist');
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
      .where(eq(conversationTable.customGptId, learningScenario.id));

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
      .where(eq(conversationTable.customGptId, learningScenario.id));
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
      throw Error('Could not delete learning scenario');
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
  userId,
}: {
  learningScenarioId: string;
  userId: string;
}): Promise<SharedLearningScenarioSelectModel[]> {
  return db
    .select()
    .from(sharedLearningScenarioTable)
    .where(
      and(
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioId),
        eq(sharedLearningScenarioTable.userId, userId),
      ),
    );
}

/**
 * Create a new shared instance for a learning scenario.
 */
export async function dbCreateLearningScenarioShare({
  userId,
  learningScenarioId,
  telliPointsLimit,
  maxUsageTimeLimit,
}: Omit<SharedLearningScenarioSelectModel, 'id'>) {
  // share learning scenario instance
  const [maybeExistingEntry] = await db
    .select()
    .from(sharedLearningScenarioTable)
    .where(
      and(
        eq(sharedLearningScenarioTable.userId, userId),
        eq(sharedLearningScenarioTable.learningScenarioId, learningScenarioId),
      ),
    );

  const inviteCode = generateInviteCode();

  const startedAt = new Date();
  const [updatedSharedChat] = await db
    .insert(sharedLearningScenarioTable)
    .values({
      id: maybeExistingEntry?.id,
      userId,
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
