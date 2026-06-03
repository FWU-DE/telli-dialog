import { instrumentOpenAiClient } from '@sentry/core';
import OpenAI from 'openai';
import type {
  AgenticStreamFn,
  AiModel,
  TextGenerationFn,
  TextStreamFn,
  TokenUsage,
} from '../types';
import { ProviderConfigurationError } from '../../errors';
import { calculateCompletionUsage, toOpenAIMessages } from '../utils';
import { streamOpenAICompatibleAgenticResponse } from './openai-compatible';

function createIonosClient(model: AiModel): OpenAI {
  if (model.setting.provider !== 'ionos') {
    throw new ProviderConfigurationError('Invalid model configuration for IONOS');
  }

  return instrumentOpenAiClient(
    new OpenAI({
      apiKey: model.setting.apiKey,
      baseURL: model.setting.baseUrl,
    }),
  );
}

export function constructIonosTextStreamFn(model: AiModel): TextStreamFn {
  const client = createIonosClient(model);

  return async function* getIonosTextStream(
    { messages, model: modelName, maxTokens, temperature },
    onComplete,
  ) {
    const stream = await client.chat.completions.create({
      model: modelName,
      messages: toOpenAIMessages(messages),
      stream: true,
      stream_options: { include_usage: true },
      max_tokens: maxTokens,
      temperature,
    });

    let content = '';

    for await (const chunk of stream) {
      const chunkContent = chunk.choices[0]?.delta?.content;

      if (chunkContent) {
        content += chunkContent;
        yield chunkContent;
      }
    }

    // Calculate the token usage manually as IONOS does not return it
    // TODO: Add token count for image inputs
    // See: https://platform.openai.com/docs/guides/images-vision?api-mode=responses&format=file
    const calculatedUsage = calculateCompletionUsage({
      messages,
      modelMessage: { role: 'assistant', content },
    });

    const usage: TokenUsage = {
      completionTokens: calculatedUsage.completion_tokens,
      promptTokens: calculatedUsage.prompt_tokens,
      totalTokens: calculatedUsage.total_tokens,
    };

    if (onComplete) {
      await onComplete(usage);
    }
  };
}

export function constructIonosTextGenerationFn(model: AiModel): TextGenerationFn {
  const client = createIonosClient(model);

  return async function getIonosTextGeneration({
    messages,
    model: modelName,
    maxTokens,
    temperature,
  }) {
    const response = await client.chat.completions.create({
      model: modelName,
      messages: toOpenAIMessages(messages),
      stream: false,
      max_tokens: maxTokens,
      temperature,
    });

    const text = response.choices[0]?.message?.content ?? '';

    // Calculate the token usage manually as IONOS does not return it reliably
    const calculatedUsage = calculateCompletionUsage({
      messages,
      modelMessage: { role: 'assistant', content: text },
    });

    return {
      text,
      usage: {
        completionTokens: calculatedUsage.completion_tokens,
        promptTokens: calculatedUsage.prompt_tokens,
        totalTokens: calculatedUsage.total_tokens,
      },
    };
  };
}

export function constructIonosAgenticStreamFn(model: AiModel): AgenticStreamFn {
  const client = createIonosClient(model);

  return async function* getIonosAgenticTextStream({
    messages,
    model: modelName,
    maxTokens,
    temperature,
    tools,
    toolChoice,
  }) {
    yield* streamOpenAICompatibleAgenticResponse({
      client,
      messages,
      modelName,
      maxTokens,
      temperature,
      tools,
      toolChoice,
      getUsage: ({ content, toolCalls }) => {
        const completionContent = [
          content,
          ...toolCalls.map((toolCall) =>
            JSON.stringify({ name: toolCall.name, arguments: toolCall.arguments }),
          ),
        ].join('');

        const calculatedUsage = calculateCompletionUsage({
          messages,
          modelMessage: { role: 'assistant', content: completionContent },
        });

        return {
          completionTokens: calculatedUsage.completion_tokens,
          promptTokens: calculatedUsage.prompt_tokens,
          totalTokens: calculatedUsage.total_tokens,
        };
      },
      providerName: 'IONOS',
    });
  };
}
