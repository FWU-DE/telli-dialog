import { billImageGenerationUsageToApiKey, isApiKeyOverQuota } from '../api-keys/billing';
import { generateImage } from './providers';
import { hasAccessToImageModel } from '../api-keys/model-access';
import { ImageGenerationError, InvalidImageModelError } from './errors';
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
export async function generateImageWithBilling(
  modelId: string,
  prompt: string,
  apiKeyId: string,
) {
  const model = await getImageModelById(modelId);

  // Run access check and quota check in parallel for better performance
  const [hasAccess, isOverQuota] = await Promise.all([
    hasAccessToImageModel(apiKeyId, model),
    isApiKeyOverQuota(apiKeyId),
  ]);

  if (!hasAccess) {
    throw new InvalidImageModelError(
      `API key does not have access to the image model: ${model.name}`,
    );
  }

  if (isOverQuota) {
    throw new ImageGenerationError(`API key has exceeded its monthly quota`);
  }

  try {
    // generate
    const imageResponse = await generateImage(model, prompt);

    // bill to api key
    const priceInCents = await billImageGenerationUsageToApiKey(apiKeyId, model);

    return {
      ...imageResponse,
      priceInCents,
    };
  } catch (error) {
    // if error is not child of ImageGenerationError, wrap it
    if (!(error instanceof ImageGenerationError)) {
      throw new ImageGenerationError(
        `Image generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    throw error;
  }
}
