'use server';
import { requireAdminAuth } from '@/auth/requireAdminAuth';
import {
  getFederalStateById,
  createFederalState,
  updateFederalState,
} from '@shared/federal-states/federal-state-service';
import {
  federalStateFeatureTogglesSchema,
  FederalStateInsertModel,
  FederalStateUpdateModel,
} from '@shared/db/schema';
import { encrypt } from '@shared/db/crypto';
import { env } from '@shared/env';

export async function getFederalStateByIdAction(federalStateId: string) {
  await requireAdminAuth();

  return getFederalStateById(federalStateId);
}

export async function createFederalStateAction(
  data: Omit<FederalStateInsertModel, 'createdAt' | 'featureToggles' | 'encryptedApiKey'>,
  plainApiKey?: string,
) {
  await requireAdminAuth();

  return createFederalState({
    ...data,
    encryptedApiKey: plainApiKey ? encrypt({
      text: plainApiKey,
      plainEncryptionKey: env.encryptionKey,
    }) : undefined,
    featureToggles: federalStateFeatureTogglesSchema.parse({}),
  });
}


export async function updateFederalStateAction(data: FederalStateUpdateModel) {
  await requireAdminAuth();

  return updateFederalState(data);
}
