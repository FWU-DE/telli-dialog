import {
  dbGetCharacterSharedChatsUsageInCentByUserId,
  dbGetChatsUsageInCentByUserId,
  dbGetSharedChatsUsageInCentByUserId,
} from '@shared/db/functions/intelli-points';
import { type UserAndContext } from '@/auth/types';
import { dbGetCreditIncreaseForCurrentMonth } from '@shared/db/functions/voucher';

export async function getPriceLimitInCentByUser(user: UserAndContext) {
  if (user.school === undefined || user.federalState === undefined) return null;

  const codeBonus = await dbGetCreditIncreaseForCurrentMonth(user.id);

  if (user.school.userRole === 'student') {
    return user.federalState.studentPriceLimit + codeBonus;
  }

  if (user.school.userRole === 'teacher') {
    return user.federalState.teacherPriceLimit + codeBonus;
  }

  return 500;
}

export async function getPriceInCentByUser(user: Omit<UserAndContext, 'subscription'>) {
  if (user.school === undefined) return null;

  // students cannot have shared chats
  const sharedChatsUsageInCent =
    user.school.userRole !== 'student'
      ? await dbGetSharedChatsUsageInCentByUserId({ userId: user.id })
      : 0;

  const characterSharedChatsUsageInCent = await dbGetCharacterSharedChatsUsageInCentByUserId({
    userId: user.id,
  });

  const chatUsageInCent = await dbGetChatsUsageInCentByUserId({ userId: user.id });

  return sharedChatsUsageInCent + characterSharedChatsUsageInCent + chatUsageInCent;
}
