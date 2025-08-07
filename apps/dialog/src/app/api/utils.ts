import { dbGetApiKeyByFederalStateIdWithResult } from '@/db/functions/federal-state';
import {
  dbGetModelByIdAndFederalStateId,
  dbGetAndUpdateLlmModelsByFederalStateId,
} from '@/db/functions/llm-model';
import { createTelliConfiguration } from './chat/custom-model-config';
import { env } from '@/env';
import { errorifyAsyncFn } from '@/utils/error';
import { LlmModel } from '@/db/schema';
import { PRICE_AND_CENT_MULTIPLIER } from '@/db/const';
import { UserAndContext } from '@/auth/types';
import { DEFAULT_AUXILIARY_MODEL } from '@/app/api/chat/models';

export function getSearchParamsFromUrl(url: string) {
  const [, ...rest] = url.split('?');

  if (rest === undefined) {
    return new URLSearchParams();
  }

  return new URLSearchParams(rest.join('?'));
}

export const getModelAndProviderWithResult = errorifyAsyncFn(getModelAndProvider);
export async function getModelAndProvider({
  federalStateId,
  modelId,
}: {
  federalStateId: string;
  modelId: string;
}): Promise<{ telliProvider: any; definedModel: LlmModel }> {
  const [error, federalStateObject] = await dbGetApiKeyByFederalStateIdWithResult({
    federalStateId,
  });

  if (error !== null) {
    throw Error(error.message);
  }

  const definedModel = await dbGetModelByIdAndFederalStateId({ modelId, federalStateId });

  if (definedModel === undefined) {
    throw Error(`Could not find model with id ${definedModel}`);
  }

  const telliConfiguration = createTelliConfiguration({
    apiKey: federalStateObject.decryptedApiKey,
    baseUrl: `${env.apiUrl}/v1`,
  });

  return { telliProvider: telliConfiguration(definedModel.name), definedModel };
}

export function calculateCostsInCents(
  model: LlmModel,
  usage: { promptTokens: number; completionTokens: number },
) {
  if (model.priceMetadata.type !== 'text') return 0;

  const completionTokenPrice =
    (usage.completionTokens * model.priceMetadata.completionTokenPrice) / PRICE_AND_CENT_MULTIPLIER;
  const promptTokenPrice =
    (usage.promptTokens * model.priceMetadata.promptTokenPrice) / PRICE_AND_CENT_MULTIPLIER;

  return completionTokenPrice + promptTokenPrice;
}

/**
 * Get the auxiliary model for the user's federal state
 * @returns The auxiliary model for the user's federal state
 */
export async function getAuxiliaryModel(user: UserAndContext): Promise<LlmModel> {
  const llmModels = await dbGetAndUpdateLlmModelsByFederalStateId({
    federalStateId: user.federalState.id,
  });
  const auxiliaryModel = llmModels.find((m) => m.name === DEFAULT_AUXILIARY_MODEL) ?? llmModels[0];
  if (auxiliaryModel === undefined) {
    throw new Error('No auxiliary model found');
  }
  return auxiliaryModel;
}
