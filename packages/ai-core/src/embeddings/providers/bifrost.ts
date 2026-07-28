import { instrumentOpenAiClient } from '@sentry/core';
import OpenAI from 'openai';
import type { AiModel, EmbeddingGenerationFn } from '../types';
import { ProviderConfigurationError } from '../../errors';
import { env } from '../../env';

type BifrostUpstreamProvider = 'azure' | 'openai' | 'ionos' | 'vertex';

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

  const provider = getBifrostUpstreamProvider(model);

  return {
    client: instrumentOpenAiClient(
      new OpenAI({
        baseURL: env.bifrostBaseUrl,
        defaultHeaders: env.bifrostApiKey ? { 'x-bf-vk': env.bifrostApiKey } : undefined,
      }),
    ),
    modelName: `${provider}/${provider === 'vertex' ? stripAnthropicPrefix(model.name) : model.name}`,
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

export function constructBifrostEmbeddingGenerationFn(model: AiModel): EmbeddingGenerationFn {
  const { client, modelName } = createBifrostClient(model);

  return async function getBifrostEmbedding({ texts }) {
    const response = await client.embeddings.create({
      model: modelName,
      input: texts,
      encoding_format: 'float',
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
