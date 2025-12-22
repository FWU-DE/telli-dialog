import { dbHasApiKeyAccessToModel } from '../api-db/functions';
import { AiModel } from '../images/types';
import type { AiModel as TextAiModel } from '../text/types';

/**
 * Checks whether the specified API key has access to the given image model.
 *
 * @param apiKeyId - The unique identifier of the API key to check access for.
 * @param imageModel - The image model to verify access against.
 * @returns A promise that resolves to `true` if the API key has access to the image model, `false` otherwise.

 */
export async function hasAccessToImageModel(
  apiKeyId: string,
  imageModel: AiModel,
): Promise<boolean> {
  return dbHasApiKeyAccessToModel({ apiKeyId, modelId: imageModel.id });
}

// TODO: combine - Identical to hasAccessToImageModel except for parameter name
/**
 * Checks whether the specified API key has access to the given text model.
 *
 * @param apiKeyId - The unique identifier of the API key to check access for.
 * @param textModel - The text model to verify access against.
 * @returns A promise that resolves to `true` if the API key has access to the text model, `false` otherwise.
 */
export async function hasAccessToTextModel(
  apiKeyId: string,
  textModel: TextAiModel,
): Promise<boolean> {
  return dbHasApiKeyAccessToModel({ apiKeyId, modelId: textModel.id });
}
