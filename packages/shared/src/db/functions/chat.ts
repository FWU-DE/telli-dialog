'use server';

import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '..';
import { conversationMessageTable, conversationTable } from '../schema';
import { ConversationMessageModel, InsertConversationMessageModel } from '../types';
import { isNotNull } from '../../utils/guard';

export async function dbCreateConversation({
  conversationId,
  userId,
  characterId,
}: {
  conversationId: string;
  userId: string;
  characterId?: string;
}) {
  return (
    await db
      .insert(conversationTable)
      .values({ id: conversationId, userId, characterId: characterId ?? null })
      .returning()
  )[0];
}

export async function dbGetOrCreateConversation({
  conversationId,
  userId,
  characterId,
  customGptId,
}: {
  conversationId: string;
  userId: string;
  characterId?: string;
  customGptId?: string;
}) {
  return (
    await db
      .insert(conversationTable)
      .values({
        id: conversationId,
        userId,
        characterId: characterId ?? null,
        customGptId: customGptId ?? null,
      })
      .onConflictDoUpdate({
        target: conversationTable.id,
        set: { id: conversationId },
      })
      .returning()
  )[0];
}

export async function dbGetCoversationMessages({
  userId,
  conversationId,
}: {
  userId: string;
  conversationId: string;
}): Promise<ConversationMessageModel[]> {
  const messages = await db
    .select()
    .from(conversationMessageTable)
    .innerJoin(conversationTable, eq(conversationMessageTable.conversationId, conversationTable.id))
    .where(
      and(
        eq(conversationMessageTable.conversationId, conversationId),
        eq(conversationTable.userId, userId),
        isNull(conversationMessageTable.deletedAt),
      ),
    )
    .orderBy(conversationMessageTable.orderNumber);

  const cleanedMessages = getLatestMessages(
    messages.map((message) => message.conversation_message),
  );

  return cleanedMessages;
}

export async function dbInsertChatContent(chatContent: InsertConversationMessageModel) {
  return (
    await db.insert(conversationMessageTable).values(chatContent).onConflictDoNothing().returning()
  )[0];
}

export async function dbGetConversations(userId: string) {
  return db
    .select()
    .from(conversationTable)
    .where(and(eq(conversationTable.userId, userId), isNull(conversationTable.deletedAt)))
    .orderBy(desc(conversationTable.createdAt));
}

export async function dbGetConversationById(conversationId: string) {
  return (
    await db
      .select()
      .from(conversationTable)
      .where(and(eq(conversationTable.id, conversationId), isNull(conversationTable.deletedAt)))
  )[0];
}

export async function dbUpdateConversationTitle({
  conversationId,
  name,
  userId,
}: {
  name: string;
  conversationId: string;
  userId: string;
}) {
  const [updatedRow] = await db
    .update(conversationTable)
    .set({ name })
    .where(
      and(
        eq(conversationTable.id, conversationId),
        isNull(conversationTable.deletedAt),
        eq(conversationTable.userId, userId),
      ),
    )
    .returning();

  return updatedRow;
}

export async function dbDeleteConversation(conversationId: string) {
  await db
    .update(conversationMessageTable)
    .set({ content: ' ', deletedAt: new Date() })
    .where(eq(conversationMessageTable.conversationId, conversationId));
  await db
    .update(conversationTable)
    .set({ name: ' ', deletedAt: new Date() })
    .where(eq(conversationTable.id, conversationId));
}

export async function dbDeleteAllConversationsByUserId(userId: string) {
  await db
    .update(conversationMessageTable)
    .set({ content: ' ', deletedAt: new Date() })
    .where(eq(conversationMessageTable.userId, userId));
  await db
    .update(conversationTable)
    .set({ name: ' ', deletedAt: new Date() })
    .where(eq(conversationTable.userId, userId));
}

export async function dbDeleteConversationMessage(conversationMessageId: string) {
  await db
    .update(conversationMessageTable)
    .set({ content: ' ', deletedAt: new Date() })
    .where(eq(conversationMessageTable.id, conversationMessageId));
}

export async function dbUpdateConversationMessageContent(
  conversationMessageId: string,
  conversationMessageContent: string,
) {
  await db
    .update(conversationMessageTable)
    .set({ content: conversationMessageContent })
    .where(eq(conversationMessageTable.id, conversationMessageId));
}

function getLatestMessages(messages: ConversationMessageModel[]): ConversationMessageModel[] {
  const messageMap = new Map<number, ConversationMessageModel>();

  messages.forEach((message) => {
    const existing = messageMap.get(message.orderNumber);
    // If there's no message for this orderNumber yet,
    // or if the current message is more recent, update the map.
    if (!existing || existing.createdAt.getTime() < message.createdAt.getTime()) {
      messageMap.set(message.orderNumber, message);
    }
  });

  // Return the deduplicated messages as an array.
  return Array.from(messageMap.values());
}

export async function dbGetConversationAndMessages({
  conversationId,
  userId,
}: {
  conversationId: string;
  userId: string;
}) {
  const rows = await db
    .select()
    .from(conversationTable)
    .leftJoin(
      conversationMessageTable,
      and(
        eq(conversationTable.id, conversationMessageTable.conversationId),
        isNull(conversationMessageTable.deletedAt),
      ),
    )
    .where(
      and(
        eq(conversationTable.id, conversationId),
        eq(conversationTable.userId, userId),
        isNull(conversationTable.deletedAt),
      ),
    )
    .orderBy(conversationMessageTable.orderNumber);

  const firstRow = rows[0];

  if (firstRow === undefined) {
    return undefined;
  }

  const nonNullMessages = rows.map((r) => r.conversation_message).filter(isNotNull);
  return {
    conversation: firstRow.conversation,
    messages: getLatestMessages(nonNullMessages),
  };
}
