import { constructAzureEmbeddingGenerationFn } from './azure';
import { constructIonosEmbeddingGenerationFn } from './ionos';
import { EmbeddingGenerationFn, AiModel } from '../types';
import { ProviderConfigurationError } from '../../errors';

function getEmbeddingGenerationFnByModel({ model }: { model: AiModel }): EmbeddingGenerationFn | undefined {
  if (model.provider === 'azure') {
    return constructAzureEmbeddingGenerationFn(model);
  }
  if (model.provider === 'ionos') {
    return constructIonosEmbeddingGenerationFn(model);
  }

  return undefined;
}

export async function generateEmbeddings(model: AiModel, texts: string[]) {
  const generationFn = getEmbeddingGenerationFnByModel({ model });
  if (!generationFn) {
    throw new ProviderConfigurationError(
      `No embedding generation function found for provider: ${model.provider}`,
    );
  }
  return generationFn({ texts, model: model.name });
}
