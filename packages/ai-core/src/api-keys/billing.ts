import {
  dbCreateImageGenerationUsage,
  dbGetApiKeyLimit,
  dbGetCompletionUsageCostsSinceStartOfCurrentMonth,
  dbGetImageGenerationUsageCostsSinceStartOfCurrentMonth,
} from '../api-db/functions';
import { AiModel } from '../images/types';

/**
 * Bills image generation usage to the specified API key.
 *
 * This function records and charges the cost of image generation
 * against the quota or billing account associated with the given API key.
 *
 * @param apiKeyId - The unique identifier of the API key to bill
 * @param imageModel - The image model used for generation
 * @returns A promise that includes the price in cents charged for the operation
 */
export async function billImageGenerationUsageToApiKey(
  apiKeyId: string,
  imageModel: AiModel,
): Promise<number> {
  if (imageModel.priceMetadata.type !== 'image') {
    throw new Error(`Model ${imageModel.id} is not an image model`);
  }
  const priceInCent = imageModel.priceMetadata.pricePerImageInCent;
  await dbCreateImageGenerationUsage({
    apiKeyId,
    modelId: imageModel.id,
    costsInCent: priceInCent,
  });
  return priceInCent;
}

export async function isApiKeyOverQuota(apiKeyId: string): Promise<boolean> {
  // Get the API key with its limit
  const apiKeyData = await dbGetApiKeyLimit(apiKeyId);
  if (!apiKeyData) {
    throw new Error(`API key not found: ${apiKeyId}`);
  }

  const { limitInCent } = apiKeyData;

  // Sum completion usage costs since the start of the month
  const completionCosts = await dbGetCompletionUsageCostsSinceStartOfCurrentMonth({ apiKeyId });

  // Sum image generation usage costs since the start of the month
  const imageCosts = await dbGetImageGenerationUsageCostsSinceStartOfCurrentMonth({ apiKeyId });

  // Calculate total usage
  const totalUsage = completionCosts + imageCosts;

  // Return true if usage exceeds the limit
  return totalUsage > limitInCent;
}
