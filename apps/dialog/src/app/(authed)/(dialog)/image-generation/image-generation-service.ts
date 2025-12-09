import { getUser, userHasCompletedTraining } from '@/auth/utils';
import { userHasReachedIntelliPointLimit } from '@/app/api/chat/usage';
import { checkProductAccess } from '@/utils/vidis/access';
import { logDebug } from '@shared/logging';
import { dbGetFederalStateWithDecryptedApiKeyWithResult } from '@shared/db/functions/federal-state';
import { dbGetModelByIdAndFederalStateId } from '@shared/db/functions/llm-model';
import { env } from '@/env';
import { sendRabbitmqEvent } from '@/rabbitmq/send';
import { constructTelliBudgetExceededEvent } from '@/rabbitmq/events/budget-exceeded';
import { constructTelliNewMessageEvent } from '@/rabbitmq/events/new-message';
import { dbGetOrCreateConversation } from '@shared/db/functions/chat';
import { dbInsertConversationUsage } from '@shared/db/functions/token-usage';
export interface ImageGenerationParams {
  prompt: string;
  modelId: string;
  conversationId: string;
}

export interface ImageGenerationResult {
  created: number;
  data: Array<{
    b64_json?: string;
  }>;
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
    const response = await fetch(`${env.apiUrl}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${federalStateObject.decryptedApiKey}`,
      },
      body: JSON.stringify({
        model: definedModel.name,
        prompt: prompt.trim(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate image');
    }

    const result = await response.json();

    const costsInCent = definedModel.priceMetadata.pricePerImageInCent;

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
      created: result.created,
      data: result.data,
    };
  } catch (error) {
    console.error('Image generation error:', error);
    throw error instanceof Error
      ? error
      : new Error('Internal server error during image generation');
  }
}
