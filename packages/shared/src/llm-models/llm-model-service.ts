import { LlmModelSelectModel } from '../db/schema';
import { DEFAULT_CHAT_MODEL } from './default-llm-models';

/**
 * Get the default model from a list of models
 * @param models The list of LLM models
 * @returns The default model or undefined if none found
 */
export function getDefaultModel(models: LlmModelSelectModel[]): LlmModelSelectModel | undefined {
  return models.find((m) => m.name === DEFAULT_CHAT_MODEL) ?? getFirstTextModel(models);
}

/**
 * Get the first text model from a list of models, excluding mistral models.
 * @param models The list of LLM models
 * @returns The first text model or undefined if none found
 */
export function getFirstTextModel(models: LlmModelSelectModel[]): LlmModelSelectModel | undefined {
  return models.find(
    (m) => m.priceMetadata.type === 'text' && !m.name.toLowerCase().includes('mistral'),
  );
}

/**
 * Get text models from the list of provided models, optionally excluding mistral models.
 * @param models The list of LLM models
 * @param excludeMistral Whether to exclude mistral models
 * @returns Filtered list of text models
 */
export function getFilteredTextModels(
  models: LlmModelSelectModel[],
  excludeMistral: boolean = false,
): LlmModelSelectModel[] {
  let filteredModels = models.filter((m) => m.priceMetadata.type === 'text');

  if (excludeMistral) {
    filteredModels = filteredModels.filter((m) => !m.name.toLowerCase().includes('mistral'));
  }

  return filteredModels;
}
