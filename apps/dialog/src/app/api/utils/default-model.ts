import { dbGetLlmModelsByFederalStateId } from '@shared/db/functions/llm-model';
import { LlmModel } from '@shared/db/schema';
import {
  DEFAULT_AUXILIARY_MODEL,
  FALLBACK_AUXILIARY_MODEL,
} from '@shared/llm-models/default-llm-models';
import { getFirstTextModel, getDefaultModel } from '@shared/llm-models/llm-model-service';

/**
 * Get the auxiliary model for the federal state
 * @returns The auxiliary model for the federal state
 */
export async function getAuxiliaryModel(federalStateId: string): Promise<LlmModel> {
  const llmModels = await dbGetLlmModelsByFederalStateId({
    federalStateId,
  });
  const auxiliaryModel =
    getDefaultAuxModel(llmModels) ?? getFallbackAuxModel(llmModels) ?? getFirstTextModel(llmModels);
  if (auxiliaryModel === undefined) {
    throw new Error('No auxiliary model found');
  }
  return auxiliaryModel;
}

/**
 * Get the default model for the federal state
 * @returns The default model for the federal state
 */
export async function getDefaultModelByFederalStateId(
  federalStateId: string,
): Promise<LlmModel | undefined> {
  const llmModels = await dbGetLlmModelsByFederalStateId({
    federalStateId,
  });
  return getDefaultModel(llmModels);
}

function getDefaultAuxModel(models: LlmModel[]): LlmModel | undefined {
  return models.find((model) => model.name === DEFAULT_AUXILIARY_MODEL);
}

function getFallbackAuxModel(models: LlmModel[]): LlmModel | undefined {
  return models.find((model) => model.name === FALLBACK_AUXILIARY_MODEL);
}
