import { getPriceLimitInCentByUser } from '@/app/school';
import {
  CharacterWithShareDataModel,
  type SharedSchoolConversationSelectModel,
} from '@shared/db/schema';
import { type UserAndContext } from '@/auth/types';
import { getPriceInCentByUser } from '@/app/school';
import {
  dbGetSharedCharacterChatUsageInCentByCharacterId,
  dbGetSharedChatUsageInCentBySharedChatId,
} from '@shared/db/functions/intelli-points';
import { calculateTimeLeftForLearningScenario } from '@shared/learning-scenarios/learning-scenario-service.client';

/**
 * Calculates the shared chat limit in cents
 * @param user - The user and context
 * @param intelligencePointsPercentageLimit - The percentage limit (e.g., 10 for 10%)
 * @returns The calculated limit in cents
 */
async function calculateSharedChatLimitInCent(
  user: UserAndContext,
  intelligencePointsPercentageLimit: number,
): Promise<number> {
  const priceLimitInCent = await getPriceLimitInCentByUser(user);
  return ((priceLimitInCent ?? 0) * intelligencePointsPercentageLimit) / 100;
}

export async function sharedChatHasReachedIntelliPointLimit({
  user,
  sharedChat,
}: {
  user: UserAndContext | undefined;
  sharedChat: SharedSchoolConversationSelectModel;
}) {
  if (user === undefined || user.school === undefined || user.federalState === undefined) {
    return true;
  }

  if (sharedChatHasExpired(sharedChat)) {
    return true;
  }

  if (sharedChat.startedAt === null || sharedChat.maxUsageTimeLimit === null) {
    return true;
  }

  const sharedChatUsageInCent = await dbGetSharedChatUsageInCentBySharedChatId({
    sharedChatId: sharedChat.id,
    maxUsageTimeLimit: sharedChat.maxUsageTimeLimit,
    startedAt: sharedChat.startedAt,
  });

  if (
    user.school.userRole === 'teacher' &&
    sharedChat.intelligencePointsLimit !== null &&
    sharedChatUsageInCent <
      (await calculateSharedChatLimitInCent(user, sharedChat.intelligencePointsLimit))
  ) {
    return false;
  }

  return true;
}

export async function sharedCharacterChatHasReachedIntelliPointLimit({
  user,
  character,
}: {
  user: UserAndContext | undefined;
  character: CharacterWithShareDataModel;
}) {
  if (user === undefined || user.school === undefined || user.federalState === undefined) {
    return true;
  }

  if (sharedChatHasExpired(character)) {
    return true;
  }

  if (character.startedAt === null || character.maxUsageTimeLimit === null) {
    return true;
  }

  const characterUsageInCent = await dbGetSharedCharacterChatUsageInCentByCharacterId({
    characterId: character.id,
    maxUsageTimeLimit: character.maxUsageTimeLimit,
    startedAt: character.startedAt,
  });

  if (
    user.school.userRole === 'teacher' &&
    character.intelligencePointsLimit !== null &&
    characterUsageInCent <
      (await calculateSharedChatLimitInCent(user, character.intelligencePointsLimit))
  ) {
    return false;
  }

  return true;
}

export function sharedChatHasExpired({
  startedAt,
  maxUsageTimeLimit,
}: {
  startedAt: Date | null;
  maxUsageTimeLimit: number | null;
}) {
  const timeLeft = calculateTimeLeftForLearningScenario({ startedAt, maxUsageTimeLimit });

  if (startedAt === null || timeLeft < 1 || maxUsageTimeLimit === null) {
    // the shared chat is no viable anymore so the limit is reached
    return true;
  }
  return false;
}

export async function userHasReachedIntelliPointLimit({
  user,
}: {
  user: UserAndContext | undefined;
}) {
  if (user === undefined || user.school === undefined || user.federalState === undefined) {
    return false;
  }

  const price = await getPriceInCentByUser(user);
  const priceLimit = await getPriceLimitInCentByUser(user);

  if (price !== null && priceLimit !== null && price > priceLimit) {
    return true;
  }
  return false;
}
