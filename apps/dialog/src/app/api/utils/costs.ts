import { PRICE_AND_CENT_MULTIPLIER } from '@/db/const';
import { LlmModel } from '@shared/db/schema';

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
