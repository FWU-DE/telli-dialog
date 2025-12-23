import { OpenAI as OpenAIv4 } from 'openaiv4';
import { AiModel, EmbeddingGenerationFn } from '../types';
import { ProviderConfigurationError } from '../../errors';

export function constructIonosEmbeddingGenerationFn(model: AiModel): EmbeddingGenerationFn {
  if (model.setting.provider !== 'ionos') {
    throw new ProviderConfigurationError('Invalid model configuration for IONOS');
  }

  // TODO: Still using old OpenAI v4 client for IONOS, replace with modern client when available
  const client = new OpenAIv4({
    apiKey: model.setting.apiKey,
    baseURL: model.setting.baseUrl,
  });

  return async function getIonosEmbedding({ texts }) {
    if (texts.length === 0) {
      return {
        embeddings: [],
      };
    }

    const { data } = await client.embeddings.create({
      input: texts,
      model: model.name,
      encoding_format: 'float',
    });

    const embeddings = data.map((element) => element.embedding);
    return { embeddings };
  };
}