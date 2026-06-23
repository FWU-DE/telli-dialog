import { billTextGenerationUsageToApiKey, isApiKeyOverQuota } from '../api-keys/billing';
import { generateText, generateTextStream, generateAgenticStream } from './providers';
import { hasAccessToModel } from '../api-keys/model-access';
import { AiGenerationError, InvalidModelError } from '../errors';
import { getTextModelById, getTextModelByName } from '../models';
import type { Message, TokenUsage, GenerationOptions, StreamEvent } from './types';
export { runAgentLoop } from './agent-loop';
export { countTokens } from './utils';

// Re-export types for external consumers
export type {
  Message,
  TokenUsage,
  ChatAttachment,
  ChatImageAttachment,
  GenerationOptions,
  ToolCall,
  ToolDefinition,
  ToolHandler,
  ToolRegistry,
  ToolRegistryEntry,
  StreamEvent,
  AgenticStreamFn,
} from './types';

// Re-export utility functions and guards
export { isChatImageAttachment } from './types';

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
  options?: GenerationOptions,
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
    const textResponse = await generateText(model, messages, options);
    const priceInCents = await billTextGenerationUsageToApiKey(apiKeyId, model, textResponse.usage);

    return {
      ...textResponse,
      priceInCents,
    };
  } catch (error) {
    // Wrap non-AiGenerationError errors
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
  options?: GenerationOptions,
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
    const billingCallback = async (usage: TokenUsage) => {
      const priceInCents = await billTextGenerationUsageToApiKey(apiKeyId, model, usage);
      if (onComplete) {
        await onComplete({ usage, priceInCents });
      }
    };

    const stream = generateTextStream(model, messages, billingCallback, options);

    for await (const chunk of stream) {
      yield chunk;
    }
  } catch (error) {
    // Wrap non-AiGenerationError errors
    if (!(error instanceof AiGenerationError)) {
      throw new AiGenerationError(
        `Text generation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    throw error;
  }
}

// ── Name-based variants (for API app) ──

/**
 * Generates text using a model looked up by name, with access control and billing.
 *
 * @param modelName - The name of the text model to use for generation
 * @param messages - The conversation messages (system, user, assistant)
 * @param apiKeyId - The ID of the API key to verify access and bill usage
 *
 * @returns A promise that resolves to an object containing the generated text response, usage, price, and model metadata
 */
export async function generateTextByNameWithBilling(
  modelName: string,
  messages: Message[],
  apiKeyId: string,
  options?: GenerationOptions,
) {
  const model = await getTextModelByName(modelName, apiKeyId);
  const textResponse = await generateTextWithBilling(model.id, messages, apiKeyId, options);
  return { ...textResponse, model };
}

/**
 * Generates streaming text using a model looked up by name, with access control.
 *
 * @param modelName - The name of the text model to use for generation
 * @param messages - The conversation messages (system, user, assistant)
 * @param apiKeyId - The ID of the API key to verify access and bill usage
 * @param onComplete - Optional callback to be invoked after stream completion with usage and price data
 *
 * @returns An object with the model and an async generator that yields text chunks
 */
export async function generateTextStreamByNameWithBilling(
  modelName: string,
  messages: Message[],
  apiKeyId: string,
  onComplete?: (result: { usage: TokenUsage; priceInCents: number }) => void | Promise<void>,
  options?: GenerationOptions,
) {
  const model = await getTextModelByName(modelName, apiKeyId);
  const stream = generateTextStreamWithBilling(model.id, messages, apiKeyId, onComplete, options);
  return { stream, model };
}

/**
 * Generates a stream of agentic events (text deltas, tool calls, finish) with access control and billing.
 *
 * The caller is responsible for executing tool calls and re-invoking this function
 * with updated messages to implement the agent loop.
 *
 * @param modelId - The ID of the text model to use
 * @param messages - The conversation messages including tool results
 * @param apiKeyId - The API key for access control and billing
 * @param onComplete - Called after the stream finishes with usage and cost
 * @param options - Must include `tools` for the model to invoke
 *
 * @returns An async generator yielding StreamEvent objects
 */
export async function* generateAgenticStreamWithBilling(
  modelId: string,
  messages: Message[],
  apiKeyId: string,
  onComplete?: (result: { usage: TokenUsage; priceInCents: number }) => void | Promise<void>,
  options?: GenerationOptions,
): AsyncGenerator<StreamEvent> {
  const model = await getTextModelById(modelId);

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
    const stream = generateAgenticStream(model, messages, options);

    for await (const event of stream) {
      yield event;

      if (event.type === 'finish') {
        const priceInCents = await billTextGenerationUsageToApiKey(apiKeyId, model, event.usage);
        if (onComplete) {
          await onComplete({ usage: event.usage, priceInCents });
        }
      }
    }
  } catch (error) {
    if (!(error instanceof AiGenerationError)) {
      throw new AiGenerationError(
        `Agentic stream failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    throw error;
  }
}
