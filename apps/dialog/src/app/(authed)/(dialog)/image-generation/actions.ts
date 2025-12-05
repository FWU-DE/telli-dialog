'use server';

import { getUser } from '@/auth/utils';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { LlmModel } from '@shared/db/schema';
import { dbGetOrCreateConversation, dbInsertChatContent } from '@shared/db/functions/chat';
import { redirect } from 'next/navigation';
import { generateUUID } from '@shared/utils/uuid';
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
 * Creates a new conversation for image generation
 * Returns the conversation ID without generating the image yet
 */
export async function createImageConversationAction() {
  const user = await getUser();

  // Create a new conversation
  const newConversationId = generateUUID();
  const conversation = await dbGetOrCreateConversation({
    conversationId: newConversationId,
    userId: user.id,
  });

  if (!conversation) {
    throw new Error('Failed to create conversation');
  }

  return conversation.id;
}

/**
 * Generates an image within an existing conversation using the image generation service
 * Combines the conversation management with the actual image generation API
 */
export async function generateImageAction({
  prompt,
  modelName,
  style,
  conversationId,
}: {
  prompt: string;
  modelName: string;
  style?: { name: string; displayName: string; prompt: string };
  conversationId: string;
}) {
  const user = await getUser();

  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt is required');
  }

  // Construct the full prompt with style prompt if provided
  let fullPrompt = prompt;
  if (style && style.prompt) {
    fullPrompt = `${prompt}. Style: ${style.prompt}`;
  }
  
  // Store user prompt as a message
  await dbInsertChatContent({
    conversationId: conversationId,
    role: 'user',
    content: prompt,
    orderNumber: Date.now(),
  });
  
  try {
    console.log(`Generating image with style: ${style?.displayName || 'none'}`);
    console.log(`Full prompt: ${fullPrompt}`);
    
    // Generate image using the service
    const result = await generateImage({
      prompt: fullPrompt.trim(),
      modelId: modelName,
    });

    console.log('Generated images:', result);

    const image = result.data[0];
    if (!image?.b64_json) {
      throw new Error('No image data received from API');
    }

    // Save image to S3
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
    
    // Store generated image as assistant message
    await dbInsertChatContent({
      conversationId: conversationId,
      role: 'assistant',
      content: signedUrl,
      orderNumber: Date.now() + 1,
      modelName,
    });

    // Return the image URL
    return {
      imageUrl: signedUrl,
      conversationId,
    };
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
