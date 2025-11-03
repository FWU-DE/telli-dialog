import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '..';
import {
  conversationMessageTable,
  ConversationMessageFileMappingTable,
  conversationTable,
  fileTable,
  TextChunkTable,
} from '../schema';
import { deleteFileFromS3 } from '../../s3';

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

    const filesToDelete = (
      await tx
        .select({ fileId: ConversationMessageFileMappingTable.fileId })
        .from(ConversationMessageFileMappingTable)
        .where(eq(ConversationMessageFileMappingTable.conversationId, conversationId))
    ).map((f) => f.fileId);

    for (const fileId of filesToDelete) {
      await deleteFileFromS3({ key: fileId });
    }
    await tx
      .delete(ConversationMessageFileMappingTable)
      .where(inArray(ConversationMessageFileMappingTable.fileId, filesToDelete));
    await tx.delete(TextChunkTable).where(inArray(TextChunkTable.fileId, filesToDelete));
    await tx.delete(fileTable).where(inArray(fileTable.id, filesToDelete));

    return deletedConversation;
  });
}

export async function dbDeleteOutdatedConversations() {
  const query = sql`
WITH updated_conversations AS (
  UPDATE conversation c
  SET deleted_at = CURRENT_TIMESTAMP
  FROM user_entity u
  JOIN user_school_mapping usm ON u.id = usm.user_id
  JOIN school s ON usm.school_id = s.id
  JOIN federal_state fs ON s.federal_state_id = fs.id
  WHERE c.user_id = u.id
    AND c.deleted_at IS NULL
    AND c.created_at < CURRENT_TIMESTAMP - (fs.chat_storage_time * INTERVAL '1 day')
  RETURNING c.id
),
updated_messages AS (
  UPDATE conversation_message cm
  SET content = ''
  FROM updated_conversations uc
  WHERE cm.conversation_id = uc.id
  RETURNING cm.id
)
SELECT
  (SELECT COUNT(*) FROM updated_conversations) AS conversations_deleted,
  (SELECT COUNT(*) FROM updated_messages) AS messages_emptied;`;

  const result = await db.execute(query);

  const deletedCount = Number(result.rows[0]?.['conversations_deleted']);
  return deletedCount;
}
