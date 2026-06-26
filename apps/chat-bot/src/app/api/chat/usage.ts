import { CharacterWithShareDataModel, LearningScenarioWithShareDataModel } from '@shared/db/schema';
import { type UserAndContext } from '@/auth/types';
import {
  dbGetSharedCharacterChatUsageInCentByCharacterId,
  dbGetSharedChatUsageInCentBySharedChatId,
} from '@shared/db/functions/token-points';
import { calculateTimeLeft } from '@shared/sharing/calculate-time-left';
import {
  getMaxBudgetInCentByUser,
  getUsedBudgetInCentByUser,
} from '@shared/users/user-budget-service';

/**
 * Calculates the shared chat limit in cents
 * @param user - The user and context
 * @param tokenPointsPercentageLimit - The percentage limit (e.g., 10 for 10%)
 * @returns The calculated limit in cents
 */
async function calculateSharedChatLimitInCent(
  user: UserAndContext,
  tokenPointsPercentageLimit: number,
): Promise<number> {
  const maxBudgetInCent = await getMaxBudgetInCentByUser({
    user,
    federalState: user.federalState,
  });
  return ((maxBudgetInCent ?? 0) * tokenPointsPercentageLimit) / 100;
}

export async function sharedLearningScenarioChatHasReachedTokenPointsLimit({
  user,
  learningScenario,
}: {
  user: UserAndContext | undefined;
  learningScenario: LearningScenarioWithShareDataModel;
}) {
  if (user === undefined || user.federalState === undefined) {
    return true;
  }

  if (sharedChatHasExpired(learningScenario)) {
    return true;
  }

  const sharedChatUsageInCent = await dbGetSharedChatUsageInCentBySharedChatId({
    sharedChatId: learningScenario.id,
    maxUsageTimeLimit: learningScenario.maxUsageTimeLimit,
    startedAt: learningScenario.startedAt,
  });

  if (
    user.userRole === 'teacher' &&
    sharedChatUsageInCent <
      (await calculateSharedChatLimitInCent(user, learningScenario.tokenPointsLimit))
  ) {
    return false;
  }

  return true;
}

export async function sharedCharacterChatHasReachedTokenPointsLimit({
  user,
  character,
}: {
  user: UserAndContext | undefined;
  character: CharacterWithShareDataModel;
}) {
  if (user === undefined || user.federalState === undefined) {
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
    user.userRole === 'teacher' &&
    characterUsageInCent < (await calculateSharedChatLimitInCent(user, character.tokenPointsLimit))
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

  const timeLeft = calculateTimeLeft({ startedAt, maxUsageTimeLimit: maxUsageTimeLimit });
  if (timeLeft < 1) {
    // the shared chat is no viable anymore so the limit is reached
    return true;
  }
  return false;
}

export async function userHasReachedTokenPointsLimit({
  user,
}: {
  user: UserAndContext | undefined;
}) {
  if (user === undefined || user.federalState === undefined) {
    return false;
  }

  const usedBudget = await getUsedBudgetInCentByUser({ user });
  const maxBudget = await getMaxBudgetInCentByUser({ user, federalState: user.federalState });

  if (usedBudget !== null && maxBudget !== null && usedBudget > maxBudget) {
    return true;
  }
  return false;
}
