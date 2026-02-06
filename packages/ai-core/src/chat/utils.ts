import { getEncoding, type Tiktoken } from 'js-tiktoken';
import type OpenAI from 'openai';
import type { Message } from './types';

/**
 * Converts internal Message format to OpenAI ChatCompletionMessageParam format.
 * Handles image attachments by converting them to multimodal content arrays.
 */
export function toOpenAIMessages(
  messages: Message[],
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  return messages.map((message) => {
    // If message has image attachments, convert to multimodal content format
    if (message.attachments && message.attachments.length > 0 && message.role === 'user') {
      const contentParts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
        { type: 'text', text: message.content },
        ...message.attachments
          .filter((attachment) => attachment.type === 'image')
          .map(
            (attachment) =>
              ({
                type: 'image_url',
                image_url: { url: attachment.url },
              }) satisfies OpenAI.Chat.Completions.ChatCompletionContentPartImage,
          ),
      ];

      return {
        role: 'user',
        content: contentParts,
      } satisfies OpenAI.Chat.Completions.ChatCompletionUserMessageParam;
    }

    // Simple text message
    return {
      role: message.role,
      content: message.content,
    } satisfies OpenAI.Chat.Completions.ChatCompletionMessageParam;
  });
}

/**
 * Converts internal Message format to OpenAI Responses API input format.
 * Handles image attachments by converting them to multimodal content arrays.
 */
export function toOpenAIResponsesInput(messages: Message[]): OpenAI.Responses.EasyInputMessage[] {
  return messages.map((message) => {
    // If message has image attachments, convert to multimodal content format
    if (message.attachments && message.attachments.length > 0 && message.role !== 'system') {
      const contentParts: OpenAI.Responses.ResponseInputContent[] = [
        { type: 'input_text', text: message.content },
        ...message.attachments
          .filter((attachment) => attachment.type === 'image')
          .map(
            (attachment) =>
              ({
                type: 'input_image',
                image_url: attachment.url,
                detail: 'auto',
              }) satisfies OpenAI.Responses.ResponseInputImageContent,
          ),
      ];

      return {
        role: message.role,
        content: contentParts,
      } satisfies OpenAI.Responses.EasyInputMessage;
    }

    // Simple text message
    return {
      role: message.role,
      content: message.content,
    } satisfies OpenAI.Responses.EasyInputMessage;
  });
}

// Lazy-loaded encoder instance (cl100k_base is used for GPT-4, GPT-3.5-turbo, and newer models)
let encoder: Tiktoken | null = null;

function getEncoder(): Tiktoken {
  if (!encoder) {
    encoder = getEncoding('cl100k_base');
  }
  return encoder;
}

/**
 * Counts tokens in text using the cl100k_base encoding.
 *
 * @param text - The text to count tokens for.
 * @returns Token count.
 */
function countTokens(text: string): number {
  return getEncoder().encode(text).length;
}

/**
 * Calculates token usage for a chat completion.
 * Uses tiktoken with cl100k_base encoding for accurate token counting.
 * Only needed because IONOS does not return token usage in their streaming API responses.
 *
 * @param messages - An array of Message objects used as the prompt.
 * @param modelMessage - The final message returned by the model.
 * @returns An object containing token counts.
 */
export function calculateCompletionUsage({
  messages,
  modelMessage,
}: {
  messages: Message[];
  modelMessage: { role: 'assistant'; content: string };
}): { prompt_tokens: number; completion_tokens: number; total_tokens: number } {
  // Count tokens for all prompt messages
  // Note: This is a simplified calculation. The OpenAI api adds overhead tokens for message formatting
  // (roughly 3-4 tokens per message for role markers, etc.)
  // This can vary by model and provider and may change over time.
  const promptTokens = messages.reduce((total, message) => {
    return total + countTokens(message.content) + 4; // +4 for message overhead
  }, 3); // +3 for reply priming

  const completionTokens = modelMessage.content !== '' ? countTokens(modelMessage.content) : 0;

  return {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens,
  };
}
