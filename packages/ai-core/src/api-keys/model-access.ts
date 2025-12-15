import { dbHasApiKeyAccessToModel } from '../temp-db/functions';
import { AiModel } from '../images/types';

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
