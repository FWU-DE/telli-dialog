'use server';

import { getUser } from '@/auth/utils';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { LlmModel } from '@shared/db/schema';

/**
 * TODO: Implement image model fetching from database
 * This should filter models by priceMetadata.type === 'image'
 * and return only image generation models available to the user's federal state
 */
export async function getAvailableImageModels(): Promise<LlmModel[]> {
  const user = await getUser();

  // TODO: Implement actual database query to fetch image models
  // For now, fetch all models and filter by image type
  const allModels = await dbGetLlmModelsByFederalStateId({
    federalStateId: user.federalState.id,
  });

  // Filter for image generation models
  const imageModels = allModels.filter((model) => model.priceMetadata.type === 'image');

  return imageModels;
}

/**
 * TODO: Implement image generation action
 * This should handle the image generation request to the AI service
 */
export async function generateImageAction({
  prompt,
  modelName,
}: {
  prompt: string;
  modelName: string;
}) {
  const user = await getUser();

  // TODO: Implement image generation logic
  // 1. Validate prompt and model
  // 2. Call image generation API/service
  // 3. Save generated image to file storage
  // 4. Return image URL or file reference
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  throw new Error('Image generation not implemented yet');
}

/**
 * TODO: Implement save user's preferred image model
 * Similar to saveChatModelForUserAction but for image models
 */
export async function saveImageModelForUserAction(modelName: string) {
  const user = await getUser();

  // TODO: Implement saving user's last used image model
  // This might require adding a new field to user table: lastUsedImageModel
  
  throw new Error('Save image model preference not implemented yet');
}