import { instrumentOpenAiClient } from '@sentry/core';
import OpenAI from 'openai';
import type { AiModel, ImageGenerationFn } from '../types';
import { AiGenerationError, ProviderConfigurationError } from '../../errors';
import { env } from '../../env';

function createBifrostClient(model: AiModel): {
  client: OpenAI;
  modelName: string;
} {
  if (model.provider !== 'bifrost') {
    throw new ProviderConfigurationError('Invalid model configuration for Bifrost');
  }

  if (!env.bifrostBaseUrl) {
    throw new ProviderConfigurationError('BIFROST_BASE_URL is not configured');
  }

  return {
    client: instrumentOpenAiClient(
      new OpenAI({
        apiKey: env.bifrostApiKey ?? 'not-needed',
        baseURL: env.bifrostBaseUrl,
        ...(env.bifrostApiKey ? { defaultHeaders: { 'x-bf-vk': env.bifrostApiKey } } : {}),
      }),
    ),
    modelName: model.name,
  };
}

export function constructBifrostImageGenerationFn(model: AiModel): ImageGenerationFn {
  const { client, modelName } = createBifrostClient(model);

  return async function getBifrostImageGeneration({ prompt, options }) {
    const result = await client.images.generate({
      model: modelName,
      prompt,
      n: 1,
      size: options?.size ?? 'auto', // gpt-image: 1536x1024, imagen4: 1408x768,
    });

    if (!result.data || result.data.length === 0) {
      throw new AiGenerationError('No image data received from Bifrost');
    }

    const data = result.data
      .map((item) => item.b64_json)
      .filter((item): item is string => item !== undefined);

    if (data.length === 0) {
      throw new AiGenerationError('No image data received from Bifrost');
    }

    return {
      data,
      output_format: result.output_format,
      usage: result.usage
        ? {
            input_text_tokens: result.usage.input_tokens,
            output_text_tokens: result.usage.output_tokens_details?.text_tokens,
            output_image_tokens: result.usage.output_tokens_details?.image_tokens ?? 0,
          }
        : undefined,
    };
  };
}
