'use server';

import { fetchLargeLanguageModels } from '@/services/llm-service';

export async function getLargeLanguageModelsAction(organizationId: string) {
  // TODO: Add authentication check
  return fetchLargeLanguageModels(organizationId);
}