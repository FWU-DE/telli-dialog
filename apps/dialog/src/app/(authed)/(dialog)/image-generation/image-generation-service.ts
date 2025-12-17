import { getUser, userHasCompletedTraining } from '@/auth/utils';
import { userHasReachedIntelliPointLimit } from '@/app/api/chat/usage';
import { checkProductAccess } from '@/utils/vidis/access';
import { dbGetFederalStateWithDecryptedApiKeyWithResult } from '@shared/db/functions/federal-state';
import { dbGetModelByIdAndFederalStateId } from '@shared/db/functions/llm-model';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructTelliBudgetExceededEvent } from '@/rabbitmq/events/budget-exceeded';
import { constructTelliNewMessageEvent } from '@/rabbitmq/events/new-message';
import { dbInsertChatContent,dbGetOrCreateConversation } from '@shared/db/functions/chat';
import { dbInsertConversationUsage } from '@shared/db/functions/token-usage';
import { logError } from '@shared/logging';
import { generateImageWithBilling } from '@telli/ai-core';
import { LlmModel } from '@shared/db/schema';
import { ImageStyle } from '@shared/utils/chat';
import { generateUUID } from '@shared/utils/uuid';
import { uploadFileToS3, getSignedUrlFromS3Get } from '@shared/s3';
import { cnanoid } from '@shared/random/randomService';
import { linkFilesToConversation, dbInsertFile } from '@shared/db/functions/files';
export interface ImageGenerationParams {
  prompt: string;
  modelId: string;
  conversationId: string;
}

export interface ImageGenerationResult {
  created?: number;
  data: Array<string>;
}



/**
 * Creates a new conversation for image generation
 * Returns the conversation ID without generating the image yet
 */
async function createImageConversation(prompt: string): Promise<string> {
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

/**
 * Generates an image within an existing conversation using the image generation service
 * Combines the conversation management with the actual image generation API
 */
export async function handleImageGeneration({
  prompt,
  model,
  style,
}: {
  prompt: string;
  model: LlmModel;
  style?: ImageStyle;
}) {
  const user = await getUser();

  // Every image generation gets its own conversation
  const conversationId = await createImageConversation(prompt);

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
    userId: user.id,
    content: prompt,
    orderNumber: 1,
    parameters: style ? { imageStyle: style.name } : undefined,
  });

  try {
    // Generate image using the service
    const result = await generateImage({
      prompt: fullPrompt.trim(),
      modelId: model.id,
      conversationId,
    });

    const image = result.data[0];
    if (!image) {
      throw new Error('No image data received from API');
    }

    // Save image to S3
    const imageBuffer = Buffer.from(image, 'base64');
    const fileId = `file_${cnanoid()}`;
    const key = `message_attachments/${fileId}`;

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


/**
 * Image generation service function
 */
export async function generateImage({
  prompt,
  modelId,
  conversationId,
}: ImageGenerationParams): Promise<ImageGenerationResult> {
  const [user, hasCompletedTraining] = await Promise.all([getUser(), userHasCompletedTraining()]);
  const productAccess = checkProductAccess({ ...user, hasCompletedTraining });

  if (!productAccess.hasAccess) {
    throw new Error(productAccess.errorType || 'Access denied');
  }

  if (await userHasReachedIntelliPointLimit({ user })) {
    throw new Error('User has reached intelli points limit');
  }

  if (!prompt || prompt.trim().length === 0) {
    throw new Error('Prompt is required');
  }

  const [federalStateError, federalStateObject] =
    await dbGetFederalStateWithDecryptedApiKeyWithResult({
      federalStateId: user.federalState.id,
    });

  if (federalStateError !== null) {
    throw new Error(federalStateError.message);
  }

  if (!federalStateObject.apiKeyId) {
    throw new Error('Federal state has no API key assigned');
  }

  const definedModel = await dbGetModelByIdAndFederalStateId({
    modelId,
    federalStateId: user.federalState.id,
  });

  if (!definedModel) {
    throw new Error(`Model ${modelId} not found`);
  }

  if (definedModel.priceMetadata.type !== 'image') {
    throw new Error('Selected model is not an image generation model');
  }

  // Get conversation for RabbitMQ event
  const conversation = await dbGetOrCreateConversation({
    conversationId,
    userId: user.id,
  });

  const intelliPointsLimitReached = await userHasReachedIntelliPointLimit({ user });

  if (intelliPointsLimitReached) {
    if (conversation) {
      await sendRabbitmqEvent(
        constructTelliBudgetExceededEvent({
          anonymous: false,
          user,
          conversation,
        }),
      );
    }

    throw new Error('User has reached intelli points limit');
  }

  try {
    const result = await generateImageWithBilling(
      definedModel.id,
      prompt.trim(),
      federalStateObject.apiKeyId,
    );

    const costsInCent = result.priceInCents;

    // Track image generation usage
    await dbInsertConversationUsage({
      conversationId,
      userId: user.id,
      modelId: definedModel.id,
      completionTokens: 0, // Images don't have completion tokens
      promptTokens: 0, // Images don't have prompt tokens
      costsInCent: costsInCent,
    });

    if (conversation) {
      // Send RabbitMQ event for successful image generation
      await sendRabbitmqEvent(
        constructTelliNewMessageEvent({
          user,
          promptTokens: 0, // Images don't use tokens
          completionTokens: 0, // Images don't use tokens
          costsInCent: costsInCent,
          provider: definedModel.provider,
          anonymous: false,
          conversation,
        }),
      );
    }

    return {
      data: result.data,
    };
  } catch (error) {
    logError('Image generation failed', { error });
    throw error instanceof Error
      ? error
      : new Error('Internal server error during image generation');
  }
}
