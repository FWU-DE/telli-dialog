'use server';

import { getUser } from '@/auth/utils';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { LlmModel } from '@shared/db/schema';
import { generateImage } from './image-generation-service';
import { uploadFileToS3, getSignedUrlFromS3Get } from '@shared/s3';
import { cnanoid } from '@shared/random/randomService';

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
 * Image generation action
 * 1. Calls image generation service
 * 2. Saves generated image to S3
 * 3. Returns signed URL to access the image
 */
export async function generateImageAction({
  prompt,
  modelId,
}: {
  prompt: string;
  modelId: string;
}): Promise<string> {
  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt is required');
  }

  try {
    console.log('Generating image with prompt:', prompt);
    const result = await generateImage({
      prompt: prompt.trim(),
      modelId,
    });

    console.log('Generated images:', result);

    const image = result.data[0];
    if (!image?.b64_json) {
      throw new Error('No image data received from API');
    }

    const imageBuffer = Buffer.from(image.b64_json, 'base64');
    const fileId = `file_${cnanoid()}`;
    const key = `generated_images/${fileId}`;

    await uploadFileToS3({
      key,
      body: imageBuffer,
      contentType: 'image/png',
    });

    const signedUrl = await getSignedUrlFromS3Get({
      key,
      contentType: 'image/png',
      attachment: false,
    });

    return signedUrl;
  } catch (error) {
    console.error('Image generation failed:', error);
    throw error instanceof Error
      ? error
      : new Error('Unknown error occurred during image generation');
  }
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
