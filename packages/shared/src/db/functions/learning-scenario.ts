import { and, desc, eq, getTableColumns, inArray } from 'drizzle-orm';
import { db } from '..';
import {
  conversationMessageTable,
  conversationTable,
  fileTable,
  LearningScenarioFileMapping,
  LearningScenarioOptionalShareDataModel,
  learningScenarioTable,
  LearningScenarioWithShareDataModel,
  sharedLearningScenarioTable,
  sharedLearningScenarioUsageTracking,
  SharedLearningScenarioUsageTrackingInsertModel,
  TextChunkTable,
} from '../schema';

export async function dbGetLearningScenariosByUserId({ userId }: { userId: string }) {
  return db
    .select({
      ...getTableColumns(learningScenarioTable),
      telliPointsLimit: sharedLearningScenarioTable.telliPointsLimit,
      inviteCode: sharedLearningScenarioTable.inviteCode,
      maxUsageTimeLimit: sharedLearningScenarioTable.maxUsageTimeLimit,
      startedAt: sharedLearningScenarioTable.startedAt,
      startedBy: sharedLearningScenarioTable.userId,
    })
    .from(learningScenarioTable)
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

export async function dbGetLearningScenarioById({
  userId,
  learningScenarioId,
}: {
  userId: string;
  learningScenarioId: string;
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
  const [row] = await db
    .select({
      ...getTableColumns(learningScenarioTable),
      telliPointsLimit: sharedLearningScenarioTable.telliPointsLimit,
      inviteCode: sharedLearningScenarioTable.inviteCode,
      maxUsageTimeLimit: sharedLearningScenarioTable.maxUsageTimeLimit,
      startedAt: sharedLearningScenarioTable.startedAt,
      startedBy: sharedLearningScenarioTable.userId,
    })
    .from(learningScenarioTable)
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
  const [row] = await db
    .select({
      ...getTableColumns(learningScenarioTable),
      telliPointsLimit: sharedLearningScenarioTable.telliPointsLimit,
      inviteCode: sharedLearningScenarioTable.inviteCode,
      maxUsageTimeLimit: sharedLearningScenarioTable.maxUsageTimeLimit,
      startedAt: sharedLearningScenarioTable.startedAt,
      startedBy: sharedLearningScenarioTable.userId,
    })
    .from(learningScenarioTable)
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
  const [row] = await db
    .select({
      ...getTableColumns(learningScenarioTable),
      telliPointsLimit: sharedLearningScenarioTable.telliPointsLimit,
      inviteCode: sharedLearningScenarioTable.inviteCode,
      maxUsageTimeLimit: sharedLearningScenarioTable.maxUsageTimeLimit,
      startedAt: sharedLearningScenarioTable.startedAt,
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
    await tx.delete(TextChunkTable).where(
      inArray(
        TextChunkTable.fileId,
        relatedFiles.map((f) => f.id),
      ),
    );
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
