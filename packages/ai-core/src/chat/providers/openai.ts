import OpenAI from 'openai';
import type { AiModel, TextStreamFn, TextGenerationFn, TokenUsage } from '../types';
import { AiGenerationError, ProviderConfigurationError } from '../../errors';

function createOpenAiClient(model: AiModel): OpenAI {
  if (model.setting.provider !== 'openai') {
    throw new ProviderConfigurationError('Invalid model configuration for OpenAI');
  }

  return new OpenAI({
    apiKey: model.setting.apiKey,
    baseURL: model.setting.baseUrl,
  });
}

export function constructOpenAiTextStreamFn(model: AiModel): TextStreamFn {
  const client = createOpenAiClient(model);

  return async function* getOpenAiTextStream({ messages, model: modelId, maxTokens }, onComplete) {
    const stream = await client.chat.completions.create({
      model: modelId,
      messages,
      stream: true,
      stream_options: { include_usage: true },
      max_tokens: maxTokens,
    });

    let usage: TokenUsage | undefined;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;

      if (content) {
        yield content;
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
      throw new AiGenerationError('No usage data returned from OpenAI stream');
    }

    if (onComplete) {
      await onComplete(usage);
    }
  };
}

export function constructOpenAiTextGenerationFn(model: AiModel): TextGenerationFn {
  const client = createOpenAiClient(model);

  return async function getOpenAiTextGeneration({ messages, model: modelId, maxTokens }) {
    const response = await client.chat.completions.create({
      model: modelId,
      messages,
      stream: false,
      max_tokens: maxTokens,
    });

    const text = response.choices[0]?.message?.content ?? '';
    const usage = response.usage;

    if (!usage) {
      throw new AiGenerationError('No usage data returned from OpenAI');
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
