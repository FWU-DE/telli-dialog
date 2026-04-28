import { getPriceInCentByUser, getPriceLimitInCentByUser } from '@/app/school';
import { CharacterWithShareDataModel, LearningScenarioWithShareDataModel } from '@shared/db/schema';
import { type UserAndContext } from '@/auth/types';
import {
  dbGetSharedCharacterChatUsageInCentByCharacterId,
  dbGetSharedChatUsageInCentBySharedChatId,
} from '@shared/db/functions/telli-points';
import { calculateTimeLeft } from '@shared/sharing/calculate-time-left';

/**
 * Calculates the shared chat limit in cents
 * @param user - The user and context
 * @param telliPointsPercentageLimit - The percentage limit (e.g., 10 for 10%)
 * @returns The calculated limit in cents
 */
async function calculateSharedChatLimitInCent(
  user: UserAndContext,
  telliPointsPercentageLimit: number,
): Promise<number> {
  const priceLimitInCent = await getPriceLimitInCentByUser(user);
  return ((priceLimitInCent ?? 0) * telliPointsPercentageLimit) / 100;
}

export async function sharedChatHasReachedTelliPointsLimit({
  user,
  sharedChat,
}: {
  user: UserAndContext | undefined;
  sharedChat: LearningScenarioWithShareDataModel;
}) {
  if (user === undefined || user.school === undefined || user.federalState === undefined) {
    return true;
  }

  if (sharedChatHasExpired(sharedChat)) {
    return true;
  }

  const sharedChatUsageInCent = await dbGetSharedChatUsageInCentBySharedChatId({
    sharedChatId: sharedChat.id,
    maxUsageTimeLimit: sharedChat.maxUsageTimeLimit,
    startedAt: sharedChat.startedAt,
  });

  if (
    user.school.userRole === 'teacher' &&
    sharedChatUsageInCent <
      (await calculateSharedChatLimitInCent(user, sharedChat.telliPointsLimit))
  ) {
    return false;
  }

  return true;
}

export async function sharedCharacterChatHasReachedTelliPointsLimit({
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

  const characterUsageInCent = await dbGetSharedCharacterChatUsageInCentByCharacterId({
    characterId: character.id,
    maxUsageTimeLimit: character.maxUsageTimeLimit,
    startedAt: character.startedAt,
  });

  if (
    user.school.userRole === 'teacher' &&
    characterUsageInCent < (await calculateSharedChatLimitInCent(user, character.telliPointsLimit))
  ) {
    return false;
  }

  return true;
}

export function sharedChatHasExpired({
  startedAt,
  maxUsageTimeLimit,
  manuallyStoppedAt,
}: {
  startedAt: Date;
  maxUsageTimeLimit: number;
  manuallyStoppedAt?: Date | null;
}) {
  // Manually stopped by the user
  if (manuallyStoppedAt) {
    return true;
  }

  const timeLeft = calculateTimeLeft({ startedAt, maxUsageTimeLimit });
  if (timeLeft < 1) {
    // the shared chat is no viable anymore so the limit is reached
    return true;
  }
  return false;
}

export async function userHasReachedTelliPointsLimit({
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
