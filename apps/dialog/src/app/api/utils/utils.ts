import { dbGetFederalStateWithDecryptedApiKeyWithResult } from '@shared/db/functions/federal-state';
import {
  dbGetModelByIdAndFederalStateId,
  dbGetLlmModelsByFederalStateId,
} from '@shared/db/functions/llm-model';
import { errorifyAsyncFn } from '@shared/utils/error';
import { LlmModel } from '@shared/db/schema';
import { PRICE_AND_CENT_MULTIPLIER } from '@/db/const';
import {
  DEFAULT_AUXILIARY_MODEL,
  FALLBACK_AUXILIARY_MODEL,
} from '@shared/llm-models/default-llm-models';
import { getDefaultModel, getFirstTextModel } from '@shared/llm-models/llm-model-service';
import { logError } from '@shared/logging';
import { isValidPositiveNumber } from '@shared/utils/number';

export function getSearchParamsFromUrl(url: string) {
  const [, ...rest] = url.split('?');

  if (rest === undefined) {
    return new URLSearchParams();
  }

  return new URLSearchParams(rest.join('?'));
}

export const getModelAndApiKeyWithResult = errorifyAsyncFn(getModelAndApiKey);
async function getModelAndApiKey({
  federalStateId,
  modelId,
}: {
  federalStateId: string;
  modelId: string;
}): Promise<{ model: LlmModel; apiKeyId: string }> {
  const [error, federalStateObject] = await dbGetFederalStateWithDecryptedApiKeyWithResult({
    federalStateId,
  });

  if (error !== null) {
    logError('Error fetching federal state with decrypted API key:', error);
    throw Error(error.message);
  }

  if (!federalStateObject.apiKeyId) {
    const apiKeyError = new Error(
      `Federal state with id ${federalStateId} has no api key associated`,
    );
    logError(apiKeyError.message, apiKeyError);
    throw apiKeyError;
  }

  let model = await dbGetModelByIdAndFederalStateId({ modelId, federalStateId });

  if (model === undefined) {
    model = await getDefaultModelByFederalStateId(federalStateId);

    if (model === undefined) {
      const defaultModelError = new Error(
        `Could not find default model for federal state with id ${federalStateId}`,
      );
      logError(defaultModelError.message, defaultModelError);
      throw defaultModelError;
    }
  }

  return {
    model,
    apiKeyId: federalStateObject.apiKeyId,
  };
}

export function calculateCostsInCent(
  model: LlmModel,
  usage: { promptTokens: number; completionTokens: number },
) {
  if (model.priceMetadata.type === 'text') {
    return calculateCostsInCentForTextModel(model, usage);
  } else if (model.priceMetadata.type === 'embedding') {
    return calculateCostsInCentForEmbeddingModel(model, usage);
  } else {
    logError(
      'Invalid model type, gracefully returning 0: ' + model.priceMetadata.type,
      new TypeError('Invalid model type'),
    );
  }

  return 0;
}

function calculateCostsInCentForTextModel(
  model: LlmModel,
  usage: { promptTokens: number; completionTokens: number },
) {
  if (model.priceMetadata.type !== 'text') {
    logError(
      'Invalid model type, gracefully returning 0: ' + model.name,
      new TypeError('Invalid model type'),
    );

    return 0;
  }

  const completionTokenPrice = usage.completionTokens * model.priceMetadata.completionTokenPrice;
  const promptTokenPrice = usage.promptTokens * model.priceMetadata.promptTokenPrice;

  return (completionTokenPrice + promptTokenPrice) / PRICE_AND_CENT_MULTIPLIER;
}

function calculateCostsInCentForEmbeddingModel(
  model: LlmModel,
  usage: { promptTokens: number; completionTokens: number },
) {
  if (model.priceMetadata.type !== 'embedding') {
    logError(
      'Invalid model type, gracefully returning 0: ' + model.name,
      new TypeError('Invalid model type'),
    );

    return 0;
  }

  const promptTokenPrice = usage.promptTokens * model.priceMetadata.promptTokenPrice;

  return promptTokenPrice / PRICE_AND_CENT_MULTIPLIER;
}

/**
 * Get token usage safely, ensuring valid numbers
 * @param usage The usage object containing promptTokens and completionTokens
 * @returns An object with valid promptTokens and completionTokens
 */
export function getTokenUsage(usage: { promptTokens: number; completionTokens: number }): {
  promptTokens: number;
  completionTokens: number;
} {
  if (
    !isValidPositiveNumber(usage.promptTokens) ||
    !isValidPositiveNumber(usage.completionTokens)
  ) {
    logError(
      'Invalid token usage: promptTokens and completionTokens must be valid numbers, gracefully returning 0',
      new TypeError('Invalid token usage'),
    );

    return { promptTokens: 0, completionTokens: 0 };
  }

  return { promptTokens: usage.promptTokens, completionTokens: usage.completionTokens };
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
    const error = new Error('No auxiliary model found for federal state id ' + federalStateId);
    logError(error.message, error);

    throw error;
  }

  return auxiliaryModel;
}

/**
 * Get the default model for the federal state
 * @returns The default model for the federal state
 */
export async function getDefaultModelByFederalStateId(
  federalStateId: string,
): Promise<LlmModel | undefined> {
  const llmModels = await dbGetLlmModelsByFederalStateId({
    federalStateId,
  });

  return getDefaultModel(llmModels);
}

function getDefaultAuxModel(models: LlmModel[]): LlmModel | undefined {
  return models.find((model) => model.name === DEFAULT_AUXILIARY_MODEL);
}

function getFallbackAuxModel(models: LlmModel[]): LlmModel | undefined {
  return models.find((model) => model.name === FALLBACK_AUXILIARY_MODEL);
}
