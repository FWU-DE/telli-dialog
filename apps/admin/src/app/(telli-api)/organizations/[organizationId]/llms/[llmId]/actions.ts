'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { createLargeLanguageModel, updateLargeLanguageModel } from '@/services/llm-service';
import { CreateLargeLanguageModel, UpdateLargeLanguageModel } from '@/types/large-language-model';

export async function createLLMAction(organizationId: string, data: CreateLargeLanguageModel) {
  await requireAdminAuth();

  try {
    const result = await createLargeLanguageModel(organizationId, data);
    return result;
  } catch (error) {
    console.error('Error creating LLM:', error);
    throw error;
  }
}

export async function updateLLMAction(
  organizationId: string,
  llmId: string,
  data: UpdateLargeLanguageModel,
) {
  await requireAdminAuth();

  try {
    const result = await updateLargeLanguageModel(organizationId, llmId, data);
    return result;
  } catch (error) {
    console.error('Error updating LLM:', error);
    throw error;
  }
}
