'use server';

import { getUser } from '@/auth/utils';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { LlmModel } from '@shared/db/schema';
import { handleImageGeneration } from './image-generation-service';
import { ImageStyle } from '@shared/utils/chat';
import { DEFAULT_IMAGE_MODEL } from '@shared/llm-models/default-llm-models';
import { runServerAction } from '@shared/actions/run-server-action';

/**
 * Fetches available image generation models from database
 * Filters models by priceMetadata.type === 'image'
 * and returns only image generation models available to the user's federal state
 */
export async function getAvailableImageModels(): Promise<LlmModel[]> {
  const user = await getUser();

  const allModels = await dbGetLlmModelsByFederalStateId({
    federalStateId: user.federalState.id,
  });

  // Filter for image generation models
  const imageModels = allModels.filter((model) => model.priceMetadata.type === 'image');

  return imageModels;
}

export async function getDefaultImageModel(imageModels: LlmModel[]): Promise<LlmModel | undefined> {
  return imageModels.find((m) => m.name === DEFAULT_IMAGE_MODEL) ?? imageModels[0];
}

/**
 * Generates an image within an existing conversation using the image generation service
 * Combines the conversation management with the actual image generation API
 */
export async function generateImageAction({
  prompt,
  model,
  style,
}: {
  prompt: string;
  model: LlmModel;
  style?: ImageStyle;
}) {
  return runServerAction(handleImageGeneration)({
    prompt,
    model,
    style,
  });
}
