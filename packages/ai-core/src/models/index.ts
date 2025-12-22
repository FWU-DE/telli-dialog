import { InvalidModelError } from '../errors';
import { dbGetModelById } from '../api-db/functions';
import { AiModel } from '../images/types';
import type { AiModel as TextAiModel } from '../text/types';

export async function getImageModelById(modelId: string): Promise<AiModel> {
  const model = await dbGetModelById(modelId);
  if (!model) {
    throw new InvalidModelError(`Model with id ${modelId} not found`);
  }
  if (model.priceMetadata.type !== 'image') {
    throw new InvalidModelError(`Model with id ${modelId} is not an image model`);
  }
  return model;
}

export async function getTextModelById(modelId: string): Promise<TextAiModel> {
  const model = await dbGetModelById(modelId);
  if (!model) {
    throw new InvalidModelError(`Model with id ${modelId} not found`);
  }
  if (model.priceMetadata.type !== 'text') {
    throw new InvalidModelError(`Model with id ${modelId} is not a text model`);
  }
  return model;
}
