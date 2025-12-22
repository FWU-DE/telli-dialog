import { billTextGenerationUsageToApiKey, isApiKeyOverQuota } from '../api-keys/billing';
import { generateText, generateTextStream } from './providers';
import { hasAccessToTextModel } from '../api-keys/model-access';
import { AiGenerationError, InvalidModelError } from '../errors';
import { getTextModelById } from '../models';
import type { Message } from './types';

/**
 * Generates text using the specified model and prompt, with access control and billing.
 *
 * This function first verifies that the provided API key has access to the requested text model.
 * If access is granted, it generates the text and bills the usage to the API key.
 *
 * @param modelId - The ID of the text model to use for generation
 * @param prompt - The text prompt for the LLM
 * @param apiKeyId - The ID of the API key to verify access and bill usage
 * @param history - Optional conversation history
 *
 * @returns A promise that resolves to an object containing the generated text response, usage, and the price in cents
 */
export async function generateTextWithBilling(
  modelId: string,
  prompt: string,
  apiKeyId: string,
  history?: Message[],
) {
  const model = await getTextModelById(modelId);

  // Run access check and quota check in parallel for better performance
  const [hasAccess, isOverQuota] = await Promise.all([
    hasAccessToTextModel(apiKeyId, model),
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
    const textResponse = await generateText(model, prompt, history);

    // bill to api key
    const priceInCents = await billTextGenerationUsageToApiKey(
      apiKeyId,
      model,
      textResponse.usage,
    );

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
 * Generates streaming text using the specified model and prompt, with access control.
 *
 * This function first verifies that the provided API key has access to the requested text model.
 * Note: Billing happens after the stream completes when usage data is available.
 *
 * @param modelId - The ID of the text model to use for generation
 * @param prompt - The text prompt for the LLM
 * @param apiKeyId - The ID of the API key to verify access and bill usage
 * @param history - Optional conversation history
 *
 * @returns An async generator that yields text chunks and returns usage data with price
 */
export async function* generateTextStreamWithBilling(
  modelId: string,
  prompt: string,
  apiKeyId: string,
  history?: Message[],
) {
  const model = await getTextModelById(modelId);

  // Run access check and quota check in parallel for better performance
  const [hasAccess, isOverQuota] = await Promise.all([
    hasAccessToTextModel(apiKeyId, model),
    isApiKeyOverQuota(apiKeyId),
  ]);

  if (!hasAccess) {
    throw new InvalidModelError(`API key does not have access to the text model: ${model.name}`);
  }

  if (isOverQuota) {
    throw new AiGenerationError(`API key has exceeded its monthly quota`);
  }

  try {
    // generate stream
    const stream = generateTextStream(model, prompt, history);

    // Yield all text chunks
    for await (const chunk of stream) {
      yield chunk;
    }

    // Get usage from the return value
    const result = await stream.next();
    const usage = result.value;

    if (!usage || typeof usage !== 'object') {
      throw new AiGenerationError('No usage data returned from text generation stream');
    }

    // bill to api key
    const priceInCents = await billTextGenerationUsageToApiKey(apiKeyId, model, usage);

    return {
      usage,
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