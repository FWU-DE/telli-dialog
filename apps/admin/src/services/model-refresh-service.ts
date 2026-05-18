import { dbUpdateLlmModelsForAllFederalStates } from '@shared/db/functions/llm-model';
import { logError } from '@shared/logging';

export async function refreshAllModelsAfterSave() {
  try {
    await dbUpdateLlmModelsForAllFederalStates();
  } catch (error) {
    logError('Error refreshing LLM models after save', error);
    throw error;
  }
}
