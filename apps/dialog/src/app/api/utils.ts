import { dbGetFederalStateWithDecryptedApiKeyWithResult } from '@/db/functions/federal-state';
import {
  dbGetModelByIdAndFederalStateId,
  dbGetLlmModelsByFederalStateId,
} from '@/db/functions/llm-model';
import { createTelliConfiguration } from './chat/custom-model-config';
import { env } from '@/env';
import { errorifyAsyncFn } from '@/utils/error';
import { LlmModel } from '@/db/schema';
import { PRICE_AND_CENT_MULTIPLIER } from '@/db/const';
import { DEFAULT_AUXILIARY_MODEL, FALLBACK_AUXILIARY_MODEL } from '@/app/api/chat/models';

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
  /* eslint-disable  @typescript-eslint/no-explicit-any */
}): Promise<{ telliProvider: any; definedModel: LlmModel }> {
  const [error, federalStateObject] = await dbGetFederalStateWithDecryptedApiKeyWithResult({
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

export function calculateCostsInCent(
  model: LlmModel,
  usage: { promptTokens: number; completionTokens: number },
) {
  if (model.priceMetadata.type === 'text') {
    return calculateCostsInCentForTextModel(model, usage);
  } else if (model.priceMetadata.type === 'embedding') {
    return calculateCostsInCentForEmbeddingModel(model, usage);
  }
  return 0;
}

function calculateCostsInCentForTextModel(
  model: LlmModel,
  usage: { promptTokens: number; completionTokens: number },
) {
  if (model.priceMetadata.type !== 'text') return 0;

  const completionTokenPrice = usage.completionTokens * model.priceMetadata.completionTokenPrice;
  const promptTokenPrice = usage.promptTokens * model.priceMetadata.promptTokenPrice;

  return (completionTokenPrice + promptTokenPrice) / PRICE_AND_CENT_MULTIPLIER;
}

function calculateCostsInCentForEmbeddingModel(
  model: LlmModel,
  usage: { promptTokens: number; completionTokens: number },
) {
  if (model.priceMetadata.type !== 'embedding') return 0;

  const promptTokenPrice = usage.promptTokens * model.priceMetadata.promptTokenPrice;

  return promptTokenPrice / PRICE_AND_CENT_MULTIPLIER;
}

/**
 * Get the auxiliary model for the federal state
 * @returns The auxiliary model for the federal state
 */
export async function getAuxiliaryModel(federalStateId: string): Promise<LlmModel> {
  const llmModels = await dbGetLlmModelsByFederalStateId({
    federalStateId,
  });
  const auxiliaryModel =
    getDefaultAuxModel(llmModels) ?? getFallbackAuxModel(llmModels) ?? getFirstTextModel(llmModels);
  if (auxiliaryModel === undefined) {
    throw new Error('No auxiliary model found');
  }
  return auxiliaryModel;
}

function getDefaultAuxModel(models: LlmModel[]): LlmModel | undefined {
  return models.find((model) => model.name === DEFAULT_AUXILIARY_MODEL);
}

function getFallbackAuxModel(models: LlmModel[]): LlmModel | undefined {
  return models.find((model) => model.name === FALLBACK_AUXILIARY_MODEL);
}

function getFirstTextModel(models: LlmModel[]): LlmModel | undefined {
  return models.find((model) => model.priceMetadata.type === 'text');
}
