import { db } from '..';
import { conversationUsageTracking, ConversationUsageTrackingInsertModel } from '../schema';

export async function dbInsertConversationUsage(value: ConversationUsageTrackingInsertModel) {
  const [insertedUsage] = await db.insert(conversationUsageTracking).values(value).returning();

  if (insertedUsage === undefined) {
    throw Error('Could not insert usage');
  }

  return insertedUsage;
}
