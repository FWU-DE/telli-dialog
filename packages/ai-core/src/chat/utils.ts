// tiktoken import commented out due to runtime issues
// import { get_encoding } from 'tiktoken';
import type { Message } from './types';

/**
 * Estimates token count using a heuristic approach.
 * Uses the approximation that 1 token ≈ 4 characters for English text.
 * This is a rough estimate - actual tokenization varies by model.
 *
 * @param text - The text to estimate tokens for.
 * @returns Estimated token count.
 */
function estimateTokens(text: string): number {
  // Heuristic: ~4 characters per token for English text
  // This is a rough approximation used by many LLM applications
  return Math.ceil(text.length / 4);
}

/**
 * Concatenates the prompt messages and the model's final answer,
 * then calculates token usage using a heuristic approach.
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
  const promptText = messages.map((message) => message.content).join(' ');
  const promptTokens = estimateTokens(promptText);

  const completionText = modelMessage.content;
  const completionTokens = completionText !== '' ? estimateTokens(completionText) : 0;

  return {
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: promptTokens + completionTokens,
  };
}
// TODO @AsamMax: Fix tiktoken runtime issues and re-enable accurate token counting
// Original tiktoken implementation (commented out):
// export function calculateCompletionUsage({
//   messages,
//   modelMessage,
// }: {
//   messages: Message[];
//   modelMessage: { role: 'assistant'; content: string };
// }): { prompt_tokens: number; completion_tokens: number; total_tokens: number } {
//   const enc = get_encoding('cl100k_base');
//   try {
//     const promptText = messages.map((message) => message.content).join(' ');
//     const promptTokens = enc.encode(promptText).length;
//
//     const completionText = modelMessage.content;
//     const completionTokens = completionText !== '' ? enc.encode(completionText).length : 0;
//
//     return {
//       prompt_tokens: promptTokens,
//       completion_tokens: completionTokens,
//       total_tokens: promptTokens + completionTokens,
//     };
//   } finally {
//     // Always free the encoder after using it.
//     enc.free();
//   }
// }
