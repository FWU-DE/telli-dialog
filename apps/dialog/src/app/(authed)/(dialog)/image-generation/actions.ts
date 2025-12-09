'use server';

import { getUser } from '@/auth/utils';
import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { LlmModel } from '@shared/db/schema';
import { dbGetOrCreateConversation, dbInsertChatContent } from '@shared/db/functions/chat';
import { generateUUID } from '@shared/utils/uuid';
import { generateImage } from './image-generation-service';
import { uploadFileToS3, getSignedUrlFromS3Get } from '@shared/s3';
import { cnanoid } from '@shared/random/randomService';
import { ImageStyle } from '@shared/utils/chat';
import { linkFilesToConversation, dbInsertFile } from '@shared/db/functions/files';
import { dbDeleteConversationByIdAndUserId } from '@shared/db/functions/conversation';

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


/**
 * Creates a new conversation for image generation
 * Returns the conversation ID without generating the image yet
 */
export async function createImageConversationAction(prompt: string): Promise<string> {
  const user = await getUser();

  // Create a new conversation
  const newConversationId = generateUUID();
  const conversation = await dbGetOrCreateConversation({
    conversationId: newConversationId,
    userId: user.id,
    type: 'image-generation',
    name: prompt,
  });

  if (!conversation) {
    throw new Error('Failed to create conversation');
  }

  return conversation.id;
}

export async function deleteImageConversationAction(conversationId: string): Promise<void> {
  const user = await getUser();

  await dbDeleteConversationByIdAndUserId({
    conversationId,
    userId: user.id,
  });
}
/**
 * Generates an image within an existing conversation using the image generation service
 * Combines the conversation management with the actual image generation API
 */
export async function generateImageAction({
  prompt,
  model,
  style,
  conversationId,
}: {
  prompt: string;
  model: LlmModel;
  style?: ImageStyle;
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
    orderNumber: 1,
    parameters: style ? { imageStyle: style.name } : undefined,
  });
  
  try {
    console.log(`Generating image with style: ${style?.displayName || 'none'}`);
    console.log(`Full prompt: ${fullPrompt}`);
    
    // Generate image using the service
    const result = await generateImage({
      prompt: fullPrompt.trim(),
      modelId: model.id,
      conversationId
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

    // Create file record in database
    await dbInsertFile({
      id: fileId,
      name: `generated_image_${Date.now()}.png`,
      size: imageBuffer.length,
      type: 'image/png',
      metadata: {
        width: undefined, // Could be extracted from image if needed
        height: undefined, // Could be extracted from image if needed
      },
    });
    
    // Store generated image as assistant message
    const assistantMessage = await dbInsertChatContent({
      conversationId: conversationId,
      role: 'assistant',
      content: '', // No content needed since we're using file attachment
      orderNumber: 2,
      modelName: model.name,
      parameters: style ? { imageStyle: style.name } : undefined,
    });

    if (!assistantMessage) {
      throw new Error('Failed to create assistant message');
    }

    // Link the image file to the assistant message
    await linkFilesToConversation({
      conversationMessageId: assistantMessage.id,
      conversationId: conversationId,
      fileIds: [fileId],
    });

    // Get signed URL for immediate return (still needed for UI display)
    const signedUrl = await getSignedUrlFromS3Get({
      key,
      contentType: 'image/png',
      attachment: false,
    });


    // Return the image URL
    return {
      imageUrl: signedUrl,
      conversationId,
    };
  } catch (error) {
    throw error instanceof Error
      ? error
      : new Error('Unknown error occurred during image generation');
  }
}