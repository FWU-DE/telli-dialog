'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { getProviderKeys } from '@/services/provider-key-service';

export async function getProviderKeysAction(organizationId: string) {
  await requireAdminAuth();
  return getProviderKeys(organizationId);
}
