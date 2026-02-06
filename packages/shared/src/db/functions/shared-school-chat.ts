import { and, eq, inArray } from 'drizzle-orm';
import { db } from '..';
import {
  conversationMessageTable,
  conversationTable,
  fileTable,
  LearningScenarioFileMapping,
  learningScenarioTable,
  sharedLearningScenarioUsageTracking,
  SharedLearningScenarioUsageTrackingInsertModel,
  TextChunkTable,
} from '../schema';

export async function dbGetSharedChatsByUserId({ userId }: { userId: string }) {
  return await db
    .select()
    .from(learningScenarioTable)
    .where(eq(learningScenarioTable.userId, userId));
}

export async function dbGetSharedSchoolChatById({
  userId,
  sharedChatId,
}: {
  userId: string;
  sharedChatId: string;
}) {
  return (
    await db
      .select()
      .from(learningScenarioTable)
      .where(
        and(eq(learningScenarioTable.id, sharedChatId), eq(learningScenarioTable.userId, userId)),
      )
  )[0];
}

export async function dbGetSharedChatByIdAndInviteCode({
  id,
  inviteCode,
}: {
  id: string;
  inviteCode: string;
}) {
  const [row] = await db
    .select()
    .from(learningScenarioTable)
    .where(and(eq(learningScenarioTable.id, id), eq(learningScenarioTable.inviteCode, inviteCode)));

  return row;
}

export async function dbUpdateTokenUsageBySharedChatId(
  value: SharedLearningScenarioUsageTrackingInsertModel,
) {
  const insertedUsage = (
    await db.insert(sharedLearningScenarioUsageTracking).values(value).returning()
  )[0];
  if (insertedUsage === undefined) {
    throw Error('Could not track the token usage');
  }

  return insertedUsage;
}

export async function dbDeleteSharedSchoolChatByIdAndUserId({
  sharedChatId,
  userId,
}: {
  sharedChatId: string;
  userId: string;
}) {
  const [sharedChat] = await db
    .select()
    .from(learningScenarioTable)
    .where(
      and(eq(learningScenarioTable.id, sharedChatId), eq(learningScenarioTable.userId, userId)),
    );

  if (sharedChat === undefined) {
    throw Error('Shared school chat does not exist');
  }

  const deletedLearningScenario = await db.transaction(async (tx) => {
    const relatedFiles = await tx
      .select({ id: LearningScenarioFileMapping.fileId })
      .from(LearningScenarioFileMapping)
      .where(eq(LearningScenarioFileMapping.learningScenarioId, sharedChat.id));

    const conversations = await tx
      .select({ id: conversationTable.id })
      .from(conversationTable)
      // TODO: customGptId is wrong! replace with learningScenarioId, once it's available
      .where(eq(conversationTable.customGptId, sharedChat.id));

    if (conversations.length > 0) {
      await tx.delete(conversationMessageTable).where(
        inArray(
          conversationMessageTable.conversationId,
          conversations.map((c) => c.id),
        ),
      );
    }
    // TODO: customGptId is wrong! replace with learningScenarioId, once it's available
    await tx.delete(conversationTable).where(eq(conversationTable.customGptId, sharedChat.id));
    await tx
      .delete(LearningScenarioFileMapping)
      .where(eq(LearningScenarioFileMapping.learningScenarioId, sharedChat.id));
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
    const deletedLearningScenario = (
      await tx
        .delete(learningScenarioTable)
        .where(
          and(eq(learningScenarioTable.id, sharedChatId), eq(learningScenarioTable.userId, userId)),
        )
        .returning()
    )[0];

    if (deletedLearningScenario === undefined) {
      throw Error('Could not delete shared school chat');
    }
    return deletedLearningScenario;
  });

  return deletedLearningScenario;
}
