import { get_encoding } from "tiktoken";
import {
  ChatCompletionMessageParam,
  CompletionUsage,
} from "openai/resources/index.js";
import { ChatCompletionContentPartText } from "openai/resources/chat/completions.js";

const textEncoder = new TextEncoder();

export async function streamToController(
  controller: ReadableStreamDefaultController,
  dataFetcher:
    | AsyncGenerator<Uint8Array | string, void, unknown>
    | AsyncIterable<Uint8Array | string>,
) {
  try {
    for await (const chunk of dataFetcher) {
      if (typeof chunk === "string") {
        controller.enqueue(textEncoder.encode(chunk));
      } else {
        controller.enqueue(chunk);
      }
      controller.enqueue(textEncoder.encode("\n"));
    }
    controller.close();
  } catch (err) {
    console.error("Error during streaming:", err);
    controller.error(err);
  }
}

/**
 * Extracts text content from a message, handling both string and array content formats
 */
function extractTextFromMessage(message: ChatCompletionMessageParam): string {
  if (typeof message.content === "string") {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content
      .filter(
        (part): part is ChatCompletionContentPartText => part.type === "text",
      )
      .map((part) => part.text)
      .join(" ");
  }

  return "";
}

/**
 * Concatenates the prompt messages and the model's final answer,
 * then calculates token usage using the tiktoken library.
 * This is a HEURISTIC calculation and only exists due to IONOS
 * not sending a completion usage when requestion chat completion with streams enabled
 *
 * @param messages - An array of ChatMessage objects used as the prompt.
 * @param modelMessage - The final ChatMessage returned by the model.
 * @param model - (Optional) The model name for which to get the encoder.
 *                Defaults to "text-davinci-003".
 * @returns An object containing token counts.
 */
export function calculateCompletionUsage({
  messages,
  modelMessage,
}: {
  messages: ChatCompletionMessageParam[];
  modelMessage: ChatCompletionMessageParam;
}): CompletionUsage {
  const enc = get_encoding("cl100k_base");
  try {
    const promptText = messages.map(extractTextFromMessage).join(" ");
    const promptTokens = enc.encode(promptText).length;

    const completionText = extractTextFromMessage(modelMessage);
    const completionTokens =
      completionText !== "" ? enc.encode(completionText).length : 0;

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
