'use server';
import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { dbUpdateLlmModelsForAllFederalStates } from '@shared/db/functions/llm-model';

export async function refreshAllModelsAction() {
  await requireAdminAuth();

  return dbUpdateLlmModelsForAllFederalStates();
}
