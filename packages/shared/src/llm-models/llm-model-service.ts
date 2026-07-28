import { LlmModelSelectModel } from '../db/schema';

/**
 * Get the first text model from a list of models, excluding mistral models.
 * @param models The list of LLM models
 * @returns The first text model or undefined if none found
 */
export function getFirstTextModel<T extends LlmModelSelectModel>(models: T[]): T | undefined {
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
export function getFilteredTextModels<T extends LlmModelSelectModel>(
  models: T[],
  excludeMistral: boolean = false,
): T[] {
  let filteredModels = models.filter((m) => m.priceMetadata.type === 'text');

  if (excludeMistral) {
    filteredModels = filteredModels.filter((m) => !m.name.toLowerCase().includes('mistral'));
  }

  return filteredModels;
}
