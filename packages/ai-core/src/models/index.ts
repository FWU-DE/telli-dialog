import { InvalidModelError } from '../errors';
import { dbGetModelById, dbGetModelByNameAndApiKeyId } from '@telli/api-database';
import { AiModel } from '../images/types';
import type { AiModel as TextAiModel } from '../chat/types';
import type { AiModel as EmbeddingAiModel } from '../embeddings/types';

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

export async function getEmbeddingModelById(modelId: string): Promise<EmbeddingAiModel> {
  const model = await dbGetModelById(modelId);
  if (!model) {
    throw new InvalidModelError(`Model with id ${modelId} not found`);
  }
  if (model.priceMetadata.type !== 'embedding') {
    throw new InvalidModelError(`Model with id ${modelId} is not an embedding model`);
  }
  return model;
}

export async function getTextModelByName(
  modelName: string,
  apiKeyId: string,
): Promise<TextAiModel> {
  const model = await dbGetModelByNameAndApiKeyId({ name: modelName, apiKeyId });
  if (!model) {
    throw new InvalidModelError(`No text model with name ${modelName} found for this API key`);
  }
  if (model.priceMetadata.type !== 'text') {
    throw new InvalidModelError(`Model ${modelName} is not a text model`);
  }
  return model;
}

export async function getEmbeddingModelByName(
  modelName: string,
  apiKeyId: string,
): Promise<EmbeddingAiModel> {
  const model = await dbGetModelByNameAndApiKeyId({ name: modelName, apiKeyId });
  if (!model) {
    throw new InvalidModelError(`No embedding model with name ${modelName} found for this API key`);
  }
  if (model.priceMetadata.type !== 'embedding') {
    throw new InvalidModelError(`Model ${modelName} is not an embedding model`);
  }
  return model;
}

export async function getImageModelByName(modelName: string, apiKeyId: string): Promise<AiModel> {
  const model = await dbGetModelByNameAndApiKeyId({ name: modelName, apiKeyId });
  if (!model) {
    throw new InvalidModelError(`No image model with name ${modelName} found for this API key`);
  }
  if (model.priceMetadata.type !== 'image') {
    throw new InvalidModelError(`Model ${modelName} is not an image model`);
  }
  return model;
}
