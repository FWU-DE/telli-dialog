import {
  dbGetCharacterSharedChatsUsageInCentByUserId,
  dbGetChatsUsageInCentByUserId,
  dbGetLearningScenarioUsageInCentByUserId,
} from '@shared/db/functions/telli-points';
import { type UserAndContext } from '@/auth/types';
import { dbGetCreditIncreaseForCurrentMonth } from '@shared/db/functions/voucher';

export async function getPriceLimitInCentByUser(user: UserAndContext) {
  if (user.federalState === undefined) return null;

  const codeBonus = await dbGetCreditIncreaseForCurrentMonth(user.id);

  if (user.userRole === 'student') {
    return user.federalState.studentPriceLimit + codeBonus;
  }

  if (user.userRole === 'teacher') {
    return user.federalState.teacherPriceLimit + codeBonus;
  }

  return 500;
}

export async function getPriceInCentByUser(user: Omit<UserAndContext, 'subscription'>) {
  // students cannot have shared chats
  const sharedChatsUsageInCent =
    user.userRole !== 'student'
      ? await dbGetLearningScenarioUsageInCentByUserId({ userId: user.id })
      : 0;

  const characterSharedChatsUsageInCent = await dbGetCharacterSharedChatsUsageInCentByUserId({
    userId: user.id,
  });

  const chatUsageInCent = await dbGetChatsUsageInCentByUserId({ userId: user.id });

  return sharedChatsUsageInCent + characterSharedChatsUsageInCent + chatUsageInCent;
}
