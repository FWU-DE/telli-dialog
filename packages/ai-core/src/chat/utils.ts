import { getEncoding, type Tiktoken } from 'js-tiktoken';
import type { Message } from './types';

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
