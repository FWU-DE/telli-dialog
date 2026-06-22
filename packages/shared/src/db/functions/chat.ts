import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { db } from '..';
import { conversationMessageTable, conversationTable } from '../schema';
import type { ConversationMessageModel, InsertConversationMessageModel } from '../types';
import { isNotNull } from '../../utils/guard';

export async function dbGetOrCreateConversation({
  conversationId,
  userId,
  characterId,
  learningScenarioId,
  assistantId,
  type,
  name,
}: {
  conversationId: string;
  userId: string;
  characterId?: string;
  learningScenarioId?: string;
  assistantId?: string;
  type?: 'chat' | 'image-generation';
  name?: string;
}) {
  return (
    await db
      .insert(conversationTable)
      .values({
        id: conversationId,
        userId,
        characterId: characterId ?? null,
        learningScenarioId: learningScenarioId ?? null,
        assistantId: assistantId ?? null,
        type: type ?? 'chat',
        name: name ?? null,
      })
      .onConflictDoUpdate({
        target: conversationTable.id,
        set: { id: conversationId },
      })
      .returning()
  )[0];
}

export async function dbGetConversationMessages({
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

export async function dbGetConversationMessageById({
  userId,
  conversationId,
  messageId,
}: {
  userId: string;
  conversationId: string;
  messageId: string;
}) {
  const [message] = await db
    .select({ message: conversationMessageTable })
    .from(conversationMessageTable)
    .innerJoin(conversationTable, eq(conversationMessageTable.conversationId, conversationTable.id))
    .where(
      and(
        eq(conversationMessageTable.id, messageId),
        eq(conversationMessageTable.conversationId, conversationId),
        eq(conversationTable.userId, userId),
        isNull(conversationMessageTable.deletedAt),
      ),
    );

  return message?.message;
}

export async function dbInsertChatContent(chatContent: InsertConversationMessageModel) {
  return (
    await db.insert(conversationMessageTable).values(chatContent).onConflictDoNothing().returning()
  )[0];
}

export async function dbInsertChatContentBatch(chatContents: InsertConversationMessageModel[]) {
  return db.insert(conversationMessageTable).values(chatContents).onConflictDoNothing();
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

export async function dbDeleteRegeneratedConversationMessage({
  conversationId,
  orderNumber,
}: {
  conversationId: string;
  orderNumber: number;
}) {
  await db
    .update(conversationMessageTable)
    .set({ content: ' ', deletedAt: new Date() })
    .where(
      and(
        eq(conversationMessageTable.conversationId, conversationId),
        gt(conversationMessageTable.orderNumber, orderNumber),
        isNull(conversationMessageTable.deletedAt),
      ),
    );
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
