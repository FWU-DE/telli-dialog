import { db } from '..';
import { eq, and } from 'drizzle-orm';
import {
  customGptTable,
  conversationMessageTable,
  conversationTable,
  type CustomGptModel,
  type CustomGptInsertModel,
} from '../schema';

export async function dbGetCustomGptsByUserId({
  userId,
}: {
  userId: string;
}): Promise<CustomGptModel[]> {
  const customGpts = await db
    .select()
    .from(customGptTable)
    .where(eq(customGptTable.userId, userId));

  return customGpts;
}

export async function dbGetCustomGptById({
  customGptId,
}: {
  customGptId: string;
}): Promise<CustomGptModel | undefined> {
  const customGpt = (
    await db
      .select()
      .from(customGptTable)
      .where(and(eq(customGptTable.id, customGptId)))
  )[0];

  return customGpt;
}

export async function dbInsertCustomGpt({
  customGpt,
}: {
  customGpt: CustomGptInsertModel;
}): Promise<CustomGptModel | undefined> {
  const insertedCustomGpt = (await db.insert(customGptTable).values(customGpt).returning())[0];

  return insertedCustomGpt;
}

export async function dbUpdateCustomGpt({
  customGptId,
  customGpt,
}: {
  customGptId: string;
  customGpt: Partial<CustomGptInsertModel>;
}): Promise<CustomGptModel | undefined> {
  const updatedCustomGpt = (
    await db
      .update(customGptTable)
      .set(customGpt)
      .where(eq(customGptTable.id, customGptId))
      .returning()
  )[0];

  return updatedCustomGpt;
}

export async function dbDeleteCustomGpt({ customGptId }: { customGptId: string }) {
  await db.transaction(async (tx) => {
    const customGptConversations = await tx
      .select()
      .from(conversationTable)
      .where(eq(conversationTable.customGptId, customGptId));

    if (customGptConversations.length > 0) {
      await Promise.all(
        customGptConversations.map(async (conversation) => {
          await tx
            .delete(conversationMessageTable)
            .where(eq(conversationMessageTable.conversationId, conversation.id));
        }),
      );
    }

    await tx.delete(conversationTable).where(eq(conversationTable.customGptId, customGptId));
    await tx.delete(customGptTable).where(eq(customGptTable.id, customGptId));
  });
}
