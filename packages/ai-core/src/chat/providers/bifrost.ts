import { instrumentOpenAiClient } from '@sentry/core';
import OpenAI from 'openai';
import type { AgenticStreamFn, AiModel, TextGenerationFn, TextStreamFn } from '../types';
import { AiGenerationError, ProviderConfigurationError } from '../../errors';
import { toOpenAIMessages } from '../utils';
import { streamOpenAICompatibleAgenticResponse } from './openai-compatible';

function createBifrostClient(model: AiModel): OpenAI {
  if (model.setting.provider !== 'bifrost') {
    throw new ProviderConfigurationError('Invalid model configuration for Bifrost');
  }

  return instrumentOpenAiClient(
    new OpenAI({
      apiKey: model.setting.apiKey,
      baseURL: model.setting.baseUrl,
    }),
  );
}

export function constructBifrostTextStreamFn(model: AiModel): TextStreamFn {
  const client = createBifrostClient(model);

  return async function* getBifrostTextStream(
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

    let usage: { completionTokens: number; promptTokens: number; totalTokens: number } | undefined;

    for await (const chunk of stream) {
      const chunkContent = chunk.choices[0]?.delta?.content;

      if (chunkContent) {
        yield chunkContent;
      }

      if (chunk.usage) {
        usage = {
          completionTokens: chunk.usage.completion_tokens,
          promptTokens: chunk.usage.prompt_tokens,
          totalTokens: chunk.usage.total_tokens,
        };
      }
    }

    if (!usage) {
      throw new AiGenerationError('No usage data returned from Bifrost stream');
    }

    if (onComplete) {
      await onComplete(usage);
    }
  };
}

export function constructBifrostTextGenerationFn(model: AiModel): TextGenerationFn {
  const client = createBifrostClient(model);

  return async function getBifrostTextGeneration({
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
    const usage = response.usage;

    if (!usage) {
      throw new AiGenerationError('No usage data returned from Bifrost');
    }

    return {
      text,
      usage: {
        completionTokens: usage.completion_tokens,
        promptTokens: usage.prompt_tokens,
        totalTokens: usage.total_tokens,
      },
    };
  };
}

export function constructBifrostAgenticStreamFn(model: AiModel): AgenticStreamFn {
  const client = createBifrostClient(model);

  return async function* getBifrostAgenticTextStream({
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
      providerName: 'Bifrost',
    });
  };
}
