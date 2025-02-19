import { and, eq } from 'drizzle-orm';
import { db } from '..';
import { conversationMessageTable, conversationTable } from '../schema';

export async function dbDeleteConversationByIdAndUserId({
  conversationId,
  userId,
}: {
  conversationId: string;
  userId: string;
}) {
  return await db.transaction(async (tx) => {
    await tx
      .update(conversationMessageTable)
      .set({ content: ' ', deletedAt: new Date() })
      .where(eq(conversationMessageTable.conversationId, conversationId));
    const deletedConversation = (
      await tx
        .update(conversationTable)
        .set({ name: ' ', deletedAt: new Date() })
        .where(and(eq(conversationTable.id, conversationId), eq(conversationTable.userId, userId)))
        .returning()
    )[0];

    if (deletedConversation === undefined) {
      throw Error('Could not delete the conversation');
    }

    return deletedConversation;
  });
}
