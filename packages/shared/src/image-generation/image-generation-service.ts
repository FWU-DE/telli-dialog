import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { LlmModelSelectModel } from '@shared/db/schema';
import { getModelWithRole } from '@shared/llm-models/llm-model-service';

/**
 * Fetches available image generation models from database
 * Filters models by priceMetadata.type === 'image'
 * and returns only image generation models available to the user's federal state
 */
export async function getAvailableImageModelsForFederalState({
  federalStateId,
}: {
  federalStateId: string;
}): Promise<LlmModelSelectModel[]> {
  const allModels = await dbGetLlmModelsByFederalStateId({ federalStateId });

  // Filter for image generation models
  const imageModels = allModels.filter((model) => model.priceMetadata.type === 'image');

  return imageModels;
}

/**
 * Returns the default image generation model if it is included in the provided list,
 * otherwise returns the first model in the list or undefined if the list is empty.
 */
export function getDefaultImageModel(
  imageModels: LlmModelSelectModel[],
): LlmModelSelectModel | undefined {
  return getModelWithRole(imageModels, 'default-image') ?? imageModels[0];
}
