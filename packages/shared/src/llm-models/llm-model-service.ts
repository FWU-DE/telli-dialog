import { LlmModel } from '../db/schema';
import { DEFAULT_CHAT_MODEL } from './default-llm-models';

/**
 * Get the default model from a list of models
 * @param models Array of LLM models
 * @returns The default model
 */
export function getDefaultModel(models: LlmModel[]): LlmModel | undefined {
  const defaultModel = getDefaultTextModel(models) ?? getFirstTextModel(models);

  return defaultModel;
}

/**
 * Get the first text model from the list of models, excluding mistral models,
 * since they are not suitable for shared chats.
 * @param models The list of LlmModels
 * @returns The first text model or undefined if none found
 */
export function getFirstTextModel(models: LlmModel[]): LlmModel | undefined {
  return models.find(
    (m) => m.priceMetadata.type === 'text' && !m.name.toLowerCase().includes('mistral'),
  );
}

function getDefaultTextModel(models: LlmModel[]): LlmModel | undefined {
  return models.find((m) => m.name === DEFAULT_CHAT_MODEL);
}

/**
 * Get text models from the list of provided models, optionally excluding mistral models.
 * @param models The list of LlmModels
 * @param excludeMistral Whether to exclude mistral models
 * @returns Filtered list of text models
 */
export function getFilteredTextModels(
  models: LlmModel[],
  excludeMistral: boolean = false,
): LlmModel[] {
  let filteredModels = models.filter((m) => m.priceMetadata.type === 'text');

  if (excludeMistral) {
    filteredModels = filteredModels.filter((m) => !m.name.toLowerCase().includes('mistral'));
  }

  return filteredModels;
}
