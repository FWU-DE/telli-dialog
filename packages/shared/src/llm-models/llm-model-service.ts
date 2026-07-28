import { LlmModelSelectModel, LlmModelWithStaticRoles } from '../db/schema';
import type { StaticModelRole } from '../db/schema';

/**
 * Get the default model from a list of models
 * @param models The list of LLM models
 * @returns The default model or undefined if none found
 */
export function getDefaultModel(
  models: LlmModelWithStaticRoles[],
): LlmModelWithStaticRoles | undefined {
  return getModelByRole(models, 'default-chat') ?? getFirstTextModel(models);
}

export function getDefaultModelName(models: LlmModelWithStaticRoles[]): string {
  const model = getDefaultModel(models);
  if (!model) throw new Error('No default text model found');
  return model.name;
}

export function getModelByRole(
  models: LlmModelWithStaticRoles[],
  role: StaticModelRole,
): LlmModelWithStaticRoles | undefined {
  return models.find((model) => model.staticModelRoles?.includes(role));
}

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
