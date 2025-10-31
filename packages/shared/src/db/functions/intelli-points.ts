import { and, between, eq, sum } from 'drizzle-orm';
import { db } from '..';
import { getEndOfCurrentMonth, getStartOfCurrentMonth } from '@/utils/date';
import {
  conversationUsageTracking,
  sharedCharacterChatUsageTrackingTable,
  sharedSchoolConversationUsageTracking,
} from '../schema';

export async function dbGetSharedChatsUsageInCentByUserId({ userId }: { userId: string }) {
  const startDate = getStartOfCurrentMonth();
  const endDate = getEndOfCurrentMonth();

  const costs = await db
    .select({ totalCosts: sum(sharedSchoolConversationUsageTracking.costsInCent) })
    .from(sharedSchoolConversationUsageTracking)
    .where(
      and(
        eq(sharedSchoolConversationUsageTracking.userId, userId),
        between(sharedSchoolConversationUsageTracking.createdAt, startDate, endDate),
      ),
    );

  return Number(costs[0]?.totalCosts || 0);
}

export async function dbGetCharacterSharedChatsUsageInCentByUserId({ userId }: { userId: string }) {
  const startDate = getStartOfCurrentMonth();
  const endDate = getEndOfCurrentMonth();

  const costs = await db
    .select({ totalCosts: sum(sharedCharacterChatUsageTrackingTable.costsInCent) })
    .from(sharedCharacterChatUsageTrackingTable)
    .where(
      and(
        eq(sharedCharacterChatUsageTrackingTable.userId, userId),
        between(sharedCharacterChatUsageTrackingTable.createdAt, startDate, endDate),
      ),
    );

  return Number(costs[0]?.totalCosts || 0);
}

export async function dbGetChatsUsageInCentByUserId({ userId }: { userId: string }) {
  const startDate = getStartOfCurrentMonth();
  const endDate = getEndOfCurrentMonth();

  const costs = await db
    .select({ totalCosts: sum(conversationUsageTracking.costsInCent) })
    .from(conversationUsageTracking)
    .where(
      and(
        eq(conversationUsageTracking.userId, userId),
        between(conversationUsageTracking.createdAt, startDate, endDate),
      ),
    );

  return Number(costs[0]?.totalCosts || 0);
}

export async function dbGetSharedChatUsageInCentBySharedChatId({
  sharedChatId,
  startedAt,
  maxUsageTimeLimit,
}: {
  sharedChatId: string;
  startedAt: Date;
  maxUsageTimeLimit: number;
}) {
  const startDate = startedAt;
  const endDate = new Date(startedAt.getTime() + maxUsageTimeLimit * 60_000);

  const costs = await db
    .select({ totalCosts: sum(sharedSchoolConversationUsageTracking.costsInCent) })
    .from(sharedSchoolConversationUsageTracking)
    .where(
      and(
        eq(sharedSchoolConversationUsageTracking.sharedSchoolConversationId, sharedChatId),
        between(sharedSchoolConversationUsageTracking.createdAt, startDate, endDate),
      ),
    );

  return Number(costs[0]?.totalCosts || 0);
}

export async function dbGetSharedCharacterChatUsageInCentByCharacterId({
  characterId,
  startedAt,
  maxUsageTimeLimit,
}: {
  characterId: string;
  startedAt: Date;
  maxUsageTimeLimit: number;
}) {
  const startDate = startedAt;
  const endDate = new Date(startedAt.getTime() + maxUsageTimeLimit * 60_000);

  const costs = await db
    .select({ totalCosts: sum(sharedCharacterChatUsageTrackingTable.costsInCent) })
    .from(sharedCharacterChatUsageTrackingTable)
    .where(
      and(
        eq(sharedCharacterChatUsageTrackingTable.characterId, characterId),
        between(sharedCharacterChatUsageTrackingTable.createdAt, startDate, endDate),
      ),
    );

  return Number(costs[0]?.totalCosts || 0);
}
