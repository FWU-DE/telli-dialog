'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { fetchLargeLanguageModels } from '@/services/llm-service';

export async function getLargeLanguageModelsAction(organizationId: string) {
  await requireAdminAuth();
  
  return fetchLargeLanguageModels(organizationId);
}
