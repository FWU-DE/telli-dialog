import { get_encoding } from 'tiktoken';
import type { Message } from './types';

/**
 * Concatenates the prompt messages and the model's final answer,
 * then calculates token usage using the tiktoken library.
 * This is a HEURISTIC calculation and only exists due to IONOS
 * not sending a completion usage when requesting chat completion with streams enabled.
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
  const enc = get_encoding('cl100k_base');
  try {
    const promptText = messages.map((message) => message.content).join(' ');
    const promptTokens = enc.encode(promptText).length;

    const completionText = modelMessage.content;
    const completionTokens = completionText !== '' ? enc.encode(completionText).length : 0;

    return {
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: promptTokens + completionTokens,
    };
  } finally {
    // Always free the encoder after using it.
    enc.free();
  }
}
