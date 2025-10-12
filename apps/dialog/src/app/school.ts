import {
  dbGetCharacterSharedChatsUsageInCentByUserId,
  dbGetChatsUsageInCentByUserId,
  dbGetSharedCharacterChatUsageInCentByCharacterId,
  dbGetSharedChatsUsageInCentByUserId,
  dbGetSharedChatUsageInCentBySharedChatId,
} from '@/db/functions/intelli-points';
import { type UserAndContext } from '@/auth/types';
import { dbGetCreditIncreaseForCurrentMonth } from '@/db/functions/voucher';

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

export async function getPriceInCentBySharedChat({
  startedAt,
  maxUsageTimeLimit,
  sharedChatId,
}: {
  sharedChatId: string;
  startedAt: Date;
  maxUsageTimeLimit: number;
}) {
  const sharedChatUsageInCent = await dbGetSharedChatUsageInCentBySharedChatId({
    sharedChatId,
    maxUsageTimeLimit,
    startedAt,
  });

  return sharedChatUsageInCent;
}

export async function getPriceInCentBySharedCharacterChat({
  startedAt,
  maxUsageTimeLimit,
  characterId,
}: {
  characterId: string;
  startedAt: Date;
  maxUsageTimeLimit: number;
}) {
  const characterUsageInCent = await dbGetSharedCharacterChatUsageInCentByCharacterId({
    characterId,
    maxUsageTimeLimit,
    startedAt,
  });

  return characterUsageInCent;
}
