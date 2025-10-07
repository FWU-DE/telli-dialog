import { dbInsertConversationUsage } from '@/db/functions/token-usage';
import { dbGetAllLlmModels } from '@/db/functions/llm-model';
import {
  getPriceInCentBySharedCharacterChat,
  getPriceInCentBySharedChat,
  getPriceLimitByUser,
} from '@/app/school';
import { CharacterModel, type LlmModel, type SharedSchoolConversationModel } from '@/db/schema';
import { type UserAndContext } from '@/auth/types';
import { getPriceInCentByUser } from '@/app/school';
import { type LanguageModelUsage } from 'ai';
import { calculateTimeLeftBySharedChat } from '@/app/(authed)/(dialog)/shared-chats/[sharedSchoolChatId]/utils';
import { parseNumberOrDefault } from '@/utils/number';

export async function trackChatUsage({
  usage,
  model,
  conversationId,
  userId,
}: {
  usage: LanguageModelUsage;
  model: LlmModel | undefined;
  userId: string | undefined;
  conversationId: string | undefined;
}) {
  if (model === undefined || conversationId === undefined || userId === undefined) return;

  await dbInsertConversationUsage({
    conversationId,
    userId,
    modelId: model.id,
    completionTokens: parseNumberOrDefault(usage.completionTokens, 0),
    promptTokens: parseNumberOrDefault(usage.promptTokens, 0),
  });
}

export async function sharedChatHasReachedIntelliPointLimit({
  user,
  sharedChat,
}: {
  user: UserAndContext | undefined;
  sharedChat: SharedSchoolConversationModel;
}) {
  if (user === undefined || user.school === undefined || user.federalState === undefined) {
    return true;
  }

  if (sharedChatHasExpired(sharedChat)) {
    return true;
  }

  const models = await dbGetAllLlmModels();

  if (sharedChat.startedAt === null || sharedChat.maxUsageTimeLimit === null) {
    return true;
  }

  const priceInCent = await getPriceInCentBySharedChat({
    models,
    startedAt: sharedChat.startedAt,
    maxUsageTimeLimit: sharedChat.maxUsageTimeLimit,
    sharedChatId: sharedChat.id,
  });

  if (
    user.school.userRole === 'teacher' &&
    sharedChat.intelligencePointsLimit !== null &&
    priceInCent <
      ((await getPriceLimitByUser(user)) ?? 0 * sharedChat.intelligencePointsLimit) / 100
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
  character: CharacterModel;
}) {
  if (user === undefined || user.school === undefined || user.federalState === undefined) {
    return true;
  }

  if (sharedChatHasExpired(character)) {
    return true;
  }

  const models = await dbGetAllLlmModels();

  if (character.startedAt === null || character.maxUsageTimeLimit === null) {
    return true;
  }

  const priceInCent = await getPriceInCentBySharedCharacterChat({
    models,
    startedAt: character.startedAt,
    maxUsageTimeLimit: character.maxUsageTimeLimit,
    characterId: character.id,
  });
  if (
    user.school.userRole === 'teacher' &&
    character.intelligencePointsLimit !== null &&
    priceInCent < ((await getPriceLimitByUser(user)) ?? 0 * character.intelligencePointsLimit) / 100
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
  const timeLeft = calculateTimeLeftBySharedChat({ startedAt, maxUsageTimeLimit });

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
  const priceLimit = await getPriceLimitByUser(user);

  if (price !== null && priceLimit !== null && price > priceLimit) {
    return true;
  }
  return false;
}
