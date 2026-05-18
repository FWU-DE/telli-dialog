import { db } from '..';
import {
  conversationUsageTracking,
  type ConversationUsageTrackingInsertModel,
  type ToolCallName,
} from '../schema';

export async function dbInsertConversationUsage(value: ConversationUsageTrackingInsertModel) {
  const [insertedUsage] = await db.insert(conversationUsageTracking).values(value).returning();

  if (insertedUsage === undefined) {
    throw new Error('Could not insert usage');
  }

  return insertedUsage;
}

export async function dbInsertConversationToolCallUsage({
  conversationId,
  userId,
  toolCallName,
  costsInCent,
}: {
  conversationId: string;
  userId: string;
  toolCallName: ToolCallName;
  costsInCent: number;
}) {
  return dbInsertConversationUsage({
    conversationId,
    userId,
    toolCallName,
    costsInCent,
    modelId: null,
    completionTokens: 0,
    promptTokens: 0,
  } satisfies ConversationUsageTrackingInsertModel);
}
