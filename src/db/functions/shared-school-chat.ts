import { and, eq } from 'drizzle-orm';
import { db } from '..';
import {
  SharedCharacterChatUsageTrackingInsertModel,
  sharedCharacterChatUsageTrackingTable,
  sharedSchoolConversationTable,
  sharedSchoolConversationUsageTracking,
  SharedSchoolConversationUsageTrackingInsertModel,
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
  value: SharedCharacterChatUsageTrackingInsertModel,
) {
  const insertedUsage = (
    await db.insert(sharedCharacterChatUsageTrackingTable).values(value).returning()
  )[0];
  if (insertedUsage === undefined) {
    throw Error('Could not track the token usage');
  }

  return insertedUsage;
}
