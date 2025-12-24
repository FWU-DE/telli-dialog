import { billTextGenerationUsageToApiKey, isApiKeyOverQuota } from '../api-keys/billing';
import { generateText, generateTextStream } from './providers';
import { hasAccessToModel } from '../api-keys/model-access';
import { AiGenerationError, InvalidModelError } from '../errors';
import { getTextModelById } from '../models';
import type { Message, TokenUsage } from './types';

/**
 * Generates text using the specified model and messages, with access control and billing.
 *
 * This function first verifies that the provided API key has access to the requested text model.
 * If access is granted, it generates the text and bills the usage to the API key.
 *
 * @param modelId - The ID of the text model to use for generation
 * @param messages - The conversation messages (system, user, assistant)
 * @param apiKeyId - The ID of the API key to verify access and bill usage
 *
 * @returns A promise that resolves to an object containing the generated text response, usage, and the price in cents
 */
export async function generateTextWithBilling(
  modelId: string,
  messages: Message[],
  apiKeyId: string,
) {
  const model = await getTextModelById(modelId);

  // Run access check and quota check in parallel for better performance
  const [hasAccess, isOverQuota] = await Promise.all([
    hasAccessToModel(apiKeyId, model),
    isApiKeyOverQuota(apiKeyId),
  ]);

  if (!hasAccess) {
    throw new InvalidModelError(`API key does not have access to the text model: ${model.name}`);
  }

  if (isOverQuota) {
    throw new AiGenerationError(`API key has exceeded its monthly quota`);
  }

  try {
    // generate
    const textResponse = await generateText(model, messages);

    // bill to api key
    const priceInCents = await billTextGenerationUsageToApiKey(apiKeyId, model, textResponse.usage);

    return {
      ...textResponse,
      priceInCents,
    };
  } catch (error) {
    // if error is not child of AiGenerationError, wrap it
    if (!(error instanceof AiGenerationError)) {
      throw new AiGenerationError(
        `Text generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    throw error;
  }
}

/**
 * Generates streaming text using the specified model and messages, with access control.
 *
 * This function first verifies that the provided API key has access to the requested text model.
 * Note: Billing happens after the stream completes when usage data is available.
 *
 * @param modelId - The ID of the text model to use for generation
 * @param messages - The conversation messages (system, user, assistant)
 * @param apiKeyId - The ID of the API key to verify access and bill usage
 * @param onComplete - Optional callback to be invoked after stream completion with usage and price data
 *
 * @returns An async generator that yields text chunks and returns usage data with price
 */
export async function* generateTextStreamWithBilling(
  modelId: string,
  messages: Message[],
  apiKeyId: string,
  onComplete?: (result: { usage: TokenUsage; priceInCents: number }) => void | Promise<void>,
) {
  const model = await getTextModelById(modelId);

  // Run access check and quota check in parallel for better performance
  const [hasAccess, isOverQuota] = await Promise.all([
    hasAccessToModel(apiKeyId, model),
    isApiKeyOverQuota(apiKeyId),
  ]);

  if (!hasAccess) {
    throw new InvalidModelError(`API key does not have access to the text model: ${model.name}`);
  }

  if (isOverQuota) {
    throw new AiGenerationError(`API key has exceeded its monthly quota`);
  }

  try {
    // Create billing callback
    const billingCallback = async (usage: TokenUsage) => {
      // TODO: @AsamMax - Does this make sense? Should the provider give the price instead?
      const priceInCents = await billTextGenerationUsageToApiKey(apiKeyId, model, usage);

      // Call user's onComplete callback if provided
      if (onComplete) {
        await onComplete({ usage, priceInCents });
      }
    };

    // generate stream with billing callback
    const stream = generateTextStream(model, messages, billingCallback);

    // Yield all text chunks
    for await (const chunk of stream) {
      yield chunk;
    }
  } catch (error) {
    // if error is not child of AiGenerationError, wrap it
    if (!(error instanceof AiGenerationError)) {
      throw new AiGenerationError(
        `Text generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    throw error;
  }
}
