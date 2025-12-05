'use server';

import { getUser } from '@/auth/utils';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { LlmModel } from '@shared/db/schema';
import { dbGetOrCreateConversation, dbInsertChatContent } from '@shared/db/functions/chat';
import { redirect } from 'next/navigation';
import { generateUUID } from '@shared/utils/uuid';

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
 * Generates an image within an existing conversation
 * Should be called after the conversation is already created and navigated to
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
  
  // Log the style and full prompt for development
  console.log(`Generating image with style: ${style?.displayName || 'none'}`);
  console.log(`Full prompt: ${fullPrompt}`);
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Return a static test image URL for development
  const imageUrl = 'https://picsum.photos/512';
  
  // Store generated image as assistant message
  await dbInsertChatContent({
    conversationId: conversationId,
    role: 'assistant',
    content: imageUrl,
    orderNumber: Date.now() + 1,
    modelName,
  });

  // Return the image URL
  return {
    imageUrl,
    conversationId,
  };
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