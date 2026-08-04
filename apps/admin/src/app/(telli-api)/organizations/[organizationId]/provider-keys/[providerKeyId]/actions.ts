'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { createProviderKey, updateProviderKey } from '@/services/provider-key-service';
import type { SaveProviderKey } from '@/types/provider-key';

export async function createProviderKeyAction(organizationId: string, data: SaveProviderKey) {
  await requireAdminAuth();
  return createProviderKey(organizationId, data);
}

export async function updateProviderKeyAction(
  organizationId: string,
  providerKeyId: string,
  data: SaveProviderKey,
) {
  await requireAdminAuth();
  return updateProviderKey(organizationId, providerKeyId, data);
}
