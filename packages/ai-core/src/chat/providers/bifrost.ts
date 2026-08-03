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
import { calculateCompletionUsage, toOpenAIResponsesInput } from '../utils';
import { streamOpenAICompatibleAgenticResponse } from './openai-compatible';
import { env } from '../../env';

type BifrostUpstreamProvider = 'azure' | 'openai' | 'ionos' | 'vertex';

function createBifrostClient(model: AiModel): { client: OpenAI; modelName: string } {
  if (model.provider !== 'bifrost') {
    throw new ProviderConfigurationError('Invalid model configuration for Bifrost');
  }

  if (!env.bifrostBaseUrl) {
    throw new ProviderConfigurationError('BIFROST_BASE_URL is not configured');
  }

  const provider = getBifrostUpstreamProvider(model);
  const modelName = provider === 'vertex' ? stripAnthropicPrefix(model.name) : model.name;

  return {
    client: instrumentOpenAiClient(
      new OpenAI({
        apiKey: env.bifrostApiKey ?? 'not-needed',
        baseURL: env.bifrostBaseUrl,
      }),
    ),
    modelName: `${provider}/${modelName}`,
  };
}

function getBifrostUpstreamProvider(model: AiModel): BifrostUpstreamProvider {
  const settingProvider = model.setting.provider;
  if (settingProvider === 'azure') return 'azure';
  if (settingProvider === 'openai') return 'openai';
  if (settingProvider === 'ionos') return 'ionos';
  if (settingProvider === 'google') return 'vertex';

  throw new ProviderConfigurationError('Unsupported Bifrost upstream provider');
}

function stripAnthropicPrefix(modelName: string): string {
  return modelName.replace(/^anthropic\//, '');
}

export function constructBifrostTextStreamFn(model: AiModel): TextStreamFn {
  const { client, modelName } = createBifrostClient(model);

  return async function* getBifrostTextStream({ messages, maxTokens }, onComplete) {
    const response = await client.responses.create({
      model: modelName,
      input: toOpenAIResponsesInput(messages),
      stream: true,
      max_output_tokens: maxTokens,
      ...model.additionalParameters,
    });

    let content = '';
    let usage: TokenUsage | undefined;

    for await (const event of response) {
      if (event.type === 'response.output_text.delta') {
        content += event.delta;
        yield event.delta;
      }

      if (event.type === 'response.completed' && event.response.usage) {
        usage = {
          completionTokens: event.response.usage.output_tokens,
          promptTokens: event.response.usage.input_tokens,
          totalTokens: event.response.usage.total_tokens,
        };
      }
    }

    if (!usage) {
      const calculatedUsage = calculateCompletionUsage({
        messages,
        modelMessage: { role: 'assistant', content },
      });

      usage = {
        completionTokens: calculatedUsage.completion_tokens,
        promptTokens: calculatedUsage.prompt_tokens,
        totalTokens: calculatedUsage.total_tokens,
      };
    }

    if (onComplete) {
      await onComplete(usage);
    }
  };
}

export function constructBifrostAgenticStreamFn(model: AiModel): AgenticStreamFn {
  const { client, modelName } = createBifrostClient(model);

  return async function* getBifrostAgenticStream({ messages, maxTokens, tools, toolChoice }) {
    yield* streamOpenAICompatibleAgenticResponse({
      client,
      messages,
      modelName,
      maxTokens,
      tools,
      toolChoice,
      providerName: 'Bifrost',
      additionalParameters: model.additionalParameters as Record<string, unknown>,
    });
  };
}

export function constructBifrostTextGenerationFn(model: AiModel): TextGenerationFn {
  const { client, modelName } = createBifrostClient(model);

  return async function getBifrostTextGeneration({ messages, maxTokens }) {
    const response = await client.responses.create({
      model: modelName,
      input: toOpenAIResponsesInput(messages),
      stream: false,
      max_output_tokens: maxTokens,
      ...model.additionalParameters,
    });

    const textOutput = response.output.find((item) => item.type === 'message');
    const text =
      textOutput?.type === 'message'
        ? textOutput.content
            .filter((content) => content.type === 'output_text')
            .map((content) => (content.type === 'output_text' ? content.text : ''))
            .join('')
        : '';

    let usage: TokenUsage;

    if (response.usage) {
      usage = {
        completionTokens: response.usage.output_tokens,
        promptTokens: response.usage.input_tokens,
        totalTokens: response.usage.total_tokens,
      };
    } else {
      const calculatedUsage = calculateCompletionUsage({
        messages,
        modelMessage: { role: 'assistant', content: text },
      });

      usage = {
        completionTokens: calculatedUsage.completion_tokens,
        promptTokens: calculatedUsage.prompt_tokens,
        totalTokens: calculatedUsage.total_tokens,
      };
    }

    return {
      text,
      usage,
    };
  };
}
