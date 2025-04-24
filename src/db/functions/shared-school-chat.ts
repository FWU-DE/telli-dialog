import { and, eq, inArray } from 'drizzle-orm';
import { db } from '..';
import {
  sharedSchoolConversationTable,
  sharedSchoolConversationUsageTracking,
  SharedSchoolConversationUsageTrackingInsertModel,
  SharedSchoolConversationFileMapping,
  conversationTable,
  conversationMessageTable,
  fileTable,
} from '../schema';

export async function dbGetSharedChatsByUserId({ userId }: { userId: string }) {
  return await db
    .select()
    .from(sharedSchoolConversationTable)
    .where(eq(sharedSchoolConversationTable.userId, userId));
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
      .from(sharedSchoolConversationTable)
      .where(
        and(
          eq(sharedSchoolConversationTable.id, sharedChatId),
          eq(sharedSchoolConversationTable.userId, userId),
        ),
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
  return (
    await db
      .select()
      .from(sharedSchoolConversationTable)
      .where(
        and(
          eq(sharedSchoolConversationTable.id, id),
          eq(sharedSchoolConversationTable.inviteCode, inviteCode),
        ),
      )
  )[0];
}

export async function dbUpdateTokenUsageBySharedChatId(
  value: SharedSchoolConversationUsageTrackingInsertModel,
) {
  const insertedUsage = (
    await db.insert(sharedSchoolConversationUsageTracking).values(value).returning()
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
    .from(sharedSchoolConversationTable)
    .where(
      and(
        eq(sharedSchoolConversationTable.id, sharedChatId),
        eq(sharedSchoolConversationTable.userId, userId),
      ),
    );

  if (sharedChat === undefined) {
    throw Error('Shared school chat does not exist');
  }

  const deletedSharedChat = await db.transaction(async (tx) => {
    const relatedFiles = await tx
      .select({ id: SharedSchoolConversationFileMapping.fileId })
      .from(SharedSchoolConversationFileMapping)
      .where(eq(SharedSchoolConversationFileMapping.sharedSchoolConversationId, sharedChat.id));

    const conversations = await tx
      .select({ id: conversationTable.id })
      .from(conversationTable)
      .where(eq(conversationTable.customGptId, sharedChat.id));

    if (conversations.length > 0) {
      await tx.delete(conversationMessageTable).where(
        inArray(
          conversationMessageTable.conversationId,
          conversations.map((c) => c.id),
        ),
      );
    }
    await tx.delete(conversationTable).where(eq(conversationTable.customGptId, sharedChat.id));
    await tx
      .delete(SharedSchoolConversationFileMapping)
      .where(eq(SharedSchoolConversationFileMapping.sharedSchoolConversationId, sharedChat.id));
    await tx.delete(fileTable).where(
      inArray(
        fileTable.id,
        relatedFiles.map((f) => f.id),
      ),
    );
    const deletedSharedChat = (
      await tx
        .delete(sharedSchoolConversationTable)
        .where(
          and(
            eq(sharedSchoolConversationTable.id, sharedChatId),
            eq(sharedSchoolConversationTable.userId, userId),
          ),
        )
        .returning()
    )[0];

    if (deletedSharedChat === undefined) {
      throw Error('Could not delete shared school chat');
    }
    return deletedSharedChat;
  });

  return deletedSharedChat;
}
