import {
  dbGetModelUsageBySharedCharacterChatId,
  dbGetModelUsageBySharedChatId,
  dbGetModelUsageOfCharacterSharedChatsByUserId,
  dbGetModelUsageOfChatsByUserId,
  dbGetModelUsageOfSharedChatsByUserId,
} from '@/db/functions/intelli-points';
import { LlmModel } from '@/db/schema';
import { type UserAndContext } from '@/auth/types';
import { PRICE_AND_CENT_MULTIPLIER } from '@/db/const';
import { dbGetAllLlmModels } from '@/db/functions/llm-model';

export async function getPriceInCentByUser(user: Omit<UserAndContext, 'subscription'>) {
    
  if (user.school === undefined) return null;
  // This has to include deleted models, because there might have been usage this month
  const models = await dbGetAllLlmModels();

  // students cannot have shared chats
  const sharedChatsUsagePerModel =
    user.school.userRole !== 'student'
      ? await dbGetModelUsageOfSharedChatsByUserId({ userId: user.id })
      : [];

  const characterSharedChatsUsagePerModel = await dbGetModelUsageOfCharacterSharedChatsByUserId({
    userId: user.id,
  });

  const chatUsagePerModel = await dbGetModelUsageOfChatsByUserId({ userId: user.id });

  const usagePerModel = [
    ...sharedChatsUsagePerModel,
    ...chatUsagePerModel,
    ...characterSharedChatsUsagePerModel,
  ];

  let currentPrice = 0;

  for (const modelUsage of usagePerModel) {
    const model = models.find((model) => model.id === modelUsage.modelId);
    if (model === undefined) {
      console.error(`Could not find model with id ${modelUsage.modelId}`);
      continue;
    }

    // TODO: add image model here later
    if (model.priceMetadata.type === 'text') {
      currentPrice += calculatePriceByTextModelAndUsage({ ...modelUsage, model });
    }
  }

  const priceInCent = currentPrice / PRICE_AND_CENT_MULTIPLIER;
  return priceInCent;
}

export async function getPriceInCentBySharedChat({
  models,
  startedAt,
  maxUsageTimeLimit,
  sharedChatId,
}: {
  sharedChatId: string;
  startedAt: Date;
  maxUsageTimeLimit: number;
  models: LlmModel[];
}) {
  const sharedChatUsagePerModel = await dbGetModelUsageBySharedChatId({
    sharedChatId,
    maxUsageTimeLimit,
    startedAt,
  });

  let currentPrice = 0;

  for (const modelUsage of sharedChatUsagePerModel) {
    const model = models.find((model) => model.id === modelUsage.modelId);
    if (model === undefined) {
      console.error(`Could not find model with id ${modelUsage.modelId}`);
      continue;
    }

    // TODO: add image model here later
    if (model.priceMetadata.type === 'text') {
      currentPrice += calculatePriceByTextModelAndUsage({ ...modelUsage, model });
    }
  }

  const priceInCent = currentPrice / PRICE_AND_CENT_MULTIPLIER;
  return priceInCent;
}

export async function getPriceInCentBySharedCharacterChat({
  models,
  startedAt,
  maxUsageTimeLimit,
  characterId,
}: {
  characterId: string;
  startedAt: Date;
  maxUsageTimeLimit: number;
  models: LlmModel[];
}) {
  const characterUsagePerModel = await dbGetModelUsageBySharedCharacterChatId({
    characterId,
    maxUsageTimeLimit,
    startedAt,
  });

  let currentPrice = 0;

  for (const modelUsage of characterUsagePerModel) {
    const model = models.find((model) => model.id === modelUsage.modelId);
    if (model === undefined) {
      console.error(`Could not find model with id ${modelUsage.modelId}`);
      continue;
    }

    // TODO: add image model here later
    if (model.priceMetadata.type === 'text') {
      currentPrice += calculatePriceByTextModelAndUsage({ ...modelUsage, model });
    }
  }

  const priceInCent = currentPrice / PRICE_AND_CENT_MULTIPLIER;
  return priceInCent;
}

function calculatePriceByTextModelAndUsage({
  model,
  completionTokens,
  promptTokens,
}: {
  model: LlmModel;
  completionTokens: number;
  promptTokens: number;
}) {
  const priceMetadata = model.priceMetadata;
  if (priceMetadata.type !== 'text') return 0;

  const completionTokenPrice = completionTokens * priceMetadata.completionTokenPrice;
  const promptTokenPrice = promptTokens * priceMetadata.promptTokenPrice;

  return completionTokenPrice + promptTokenPrice;
}
