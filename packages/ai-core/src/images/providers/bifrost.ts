import { instrumentOpenAiClient } from '@sentry/core';
import OpenAI from 'openai';
import type { AiModel, ImageGenerationFn } from '../types';
import { AiGenerationError, ProviderConfigurationError } from '../../errors';

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

export function constructBifrostImageGenerationFn(model: AiModel): ImageGenerationFn {
  const client = createBifrostClient(model);

  return async function getBifrostImageGeneration({ prompt, model: modelName }) {
    const result = await client.images.generate({
      model: modelName,
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    });

    if (!result.data || result.data.length === 0) {
      throw new AiGenerationError('No image data received from Bifrost');
    }

    return {
      data: result.data
        .map((item) => item.b64_json)
        .filter((item): item is string => item !== undefined),
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
