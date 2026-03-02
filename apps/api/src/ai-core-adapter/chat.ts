import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions.js';
import type OpenAI from 'openai';
import { generateTextByNameWithBilling, generateTextStreamByNameWithBilling } from '@telli/ai-core';
import type { TokenUsage } from '@telli/ai-core';
import { ResponsibleAIError } from '@telli/ai-core/errors';
import { convertToAiCoreMessages } from './messages';

/**
 * Non-streaming chat completion using ai-core, returning an OpenAI-compatible ChatCompletion object.
 */
export async function chatCompletion({
  modelName,
  messages,
  apiKeyId,
}: {
  modelName: string;
  messages: ChatCompletionMessageParam[];
  apiKeyId: string;
}): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  const aiCoreMessages = convertToAiCoreMessages(messages);
  const result = await generateTextByNameWithBilling(modelName, aiCoreMessages, apiKeyId);

  return {
    id: `chatcmpl-${crypto.randomUUID()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: result.model.name,
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: result.text,
          refusal: null,
        },
        finish_reason: 'stop',
        logprobs: null,
      },
    ],
    usage: tokenUsageToOpenAI(result.usage),
  };
}

/**
 * Streaming chat completion using ai-core, returning an SSE-formatted ReadableStream
 * that yields OpenAI-compatible ChatCompletionChunk JSON lines.
 */
export async function chatCompletionStream({
  modelName,
  messages,
  apiKeyId,
}: {
  modelName: string;
  messages: ChatCompletionMessageParam[];
  apiKeyId: string;
}): Promise<ReadableStream<Uint8Array>> {
  const aiCoreMessages = convertToAiCoreMessages(messages);

  const { stream, model } = await generateTextStreamByNameWithBilling(
    modelName,
    aiCoreMessages,
    apiKeyId,
  );

  const encoder = new TextEncoder();
  const id = `chatcmpl-${crypto.randomUUID()}`;
  const created = Math.floor(Date.now() / 1000);

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const chunkObj: OpenAI.Chat.Completions.ChatCompletionChunk = {
            id,
            object: 'chat.completion.chunk',
            created,
            model: model.name,
            choices: [
              {
                index: 0,
                delta: { content: chunk },
                finish_reason: null,
              },
            ],
          };
          controller.enqueue(encoder.encode('data: ' + JSON.stringify(chunkObj) + '\n\n'));
        }

        // Final chunk with finish_reason
        const doneChunk: OpenAI.Chat.Completions.ChatCompletionChunk = {
          id,
          object: 'chat.completion.chunk',
          created,
          model: model.name,
          choices: [
            {
              index: 0,
              delta: {},
              finish_reason: 'stop',
            },
          ],
        };
        controller.enqueue(encoder.encode('data: ' + JSON.stringify(doneChunk) + '\n\n'));
        controller.close();
      } catch (error) {
        const isContentFilter = ResponsibleAIError.is(error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        const errorChunk: OpenAI.Chat.Completions.ChatCompletionChunk = isContentFilter
          ? {
              id,
              object: 'chat.completion.chunk',
              created,
              model: model.name,
              choices: [
                {
                  index: 0,
                  delta: {
                    content:
                      'Die Anfrage wurde wegen unangemessener Inhalte automatisch blockiert.',
                  },
                  finish_reason: 'content_filter',
                },
              ],
            }
          : ({
              id,
              object: 'chat.completion.chunk',
              created,
              model: model.name,
              choices: [
                {
                  index: 0,
                  delta: {
                    content: `Error in Chat Stream: ${errorMessage}`,
                  },
                  finish_reason: 'stop',
                },
              ],
              error: {
                message: errorMessage,
                code: 'unknown_error',
                type: 'error',
              },
            } as OpenAI.Chat.Completions.ChatCompletionChunk);

        controller.enqueue(encoder.encode('data: ' + JSON.stringify(errorChunk) + '\n\n'));
        controller.close();
      }
    },
  });
}

function tokenUsageToOpenAI(usage: TokenUsage): OpenAI.Completions.CompletionUsage {
  return {
    prompt_tokens: usage.promptTokens,
    completion_tokens: usage.completionTokens,
    total_tokens: usage.totalTokens,
  };
}
