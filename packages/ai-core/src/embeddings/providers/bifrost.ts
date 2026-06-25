import { instrumentOpenAiClient } from '@sentry/core';
import OpenAI from 'openai';
import type { AiModel, EmbeddingGenerationFn } from '../types';
import { ProviderConfigurationError } from '../../errors';

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

export function constructBifrostEmbeddingGenerationFn(model: AiModel): EmbeddingGenerationFn {
  const client = createBifrostClient(model);

  return async function getBifrostEmbedding({ texts }) {
    if (texts.length === 0) {
      return {
        embeddings: [],
      };
    }

    const response = await client.embeddings.create({
      input: texts,
      model: model.name,
    });

    const embeddings = response.data.map((element) => element.embedding);
    return {
      embeddings,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  };
}
