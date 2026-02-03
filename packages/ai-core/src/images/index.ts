import { billImageGenerationUsageToApiKey, isApiKeyOverQuota } from '../api-keys/billing';
import { generateImage } from './providers';
import { hasAccessToModel } from '../api-keys/model-access';
import { AiGenerationError, InvalidModelError } from '../errors';
import { getImageModelById } from '../models';

/**
 * Generates an image using the specified model and prompt, with access control and billing.
 *
 * This function first verifies that the provided API key has access to the requested image model.
 * If access is granted, it generates the image and bills the usage to the API key.
 *
 * @param model - The image model to use for generation
 * @param prompt - The text prompt describing the desired image
 * @param apiKeyId - The ID of the API key to verify access and bill usage
 *
 * @returns A promise that resolves to an object containing the generated image response and the price in cents
 */
export async function generateImageWithBilling(modelId: string, prompt: string, apiKeyId: string) {
  const model = await getImageModelById(modelId);

  // Run access check and quota check in parallel for better performance
  const [hasAccess, isOverQuota] = await Promise.all([
    hasAccessToModel(apiKeyId, model),
    isApiKeyOverQuota(apiKeyId),
  ]);

  if (!hasAccess) {
    throw new InvalidModelError(`API key does not have access to the image model: ${model.name}`);
  }

  if (isOverQuota) {
    throw new AiGenerationError(`API key has exceeded its monthly quota`);
  }

  try {
    const imageResponse = await generateImage(model, prompt);

    const priceInCents = await billImageGenerationUsageToApiKey(apiKeyId, model);

    return {
      ...imageResponse,
      priceInCents,
    };
  } catch (error) {
    // Wrap non-AiGenerationError errors
    if (!(error instanceof AiGenerationError)) {
      throw new AiGenerationError(
        `Image generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    throw error;
  }
}
