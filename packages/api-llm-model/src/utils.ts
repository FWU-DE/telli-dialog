import { PRICE_AND_CENT_MULTIPLIER } from './const';

export function calculatePriceInCentByTextModelAndUsage({
  completionTokens,
  promptTokens,
  priceMetadata,
}: {
  priceMetadata: { completionTokenPrice: number; promptTokenPrice: number };
  completionTokens: number;
  promptTokens: number;
}) {
  const completionTokenPrice = completionTokens * priceMetadata.completionTokenPrice;
  const promptTokenPrice = promptTokens * priceMetadata.promptTokenPrice;

  return (completionTokenPrice + promptTokenPrice) / PRICE_AND_CENT_MULTIPLIER;
}

export function calculatePriceInCentByEmbeddingModelAndUsage({
  promptTokens,
  priceMetadata,
}: {
  priceMetadata: { promptTokenPrice: number };
  promptTokens: number;
}) {
  const promptTokenPrice = promptTokens * priceMetadata.promptTokenPrice;
  return promptTokenPrice / PRICE_AND_CENT_MULTIPLIER;
}
