'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { updateApiKey } from '@shared/federal-states/federal-state-service';
import type { FederalStateModel } from '@shared/federal-states/types';

export async function updateApiKeyAction(
  federalStateId: string,
  decryptedApiKey: string,
): Promise<FederalStateModel> {
  await requireAdminAuth();
  return updateApiKey(federalStateId, decryptedApiKey);
}
