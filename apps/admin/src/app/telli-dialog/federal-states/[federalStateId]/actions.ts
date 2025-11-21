'use server';
import { requireAdminAuth } from '@/auth/requireAdminAuth';
import {
  getFederalStateById,
  createFederalState,
  updateFederalState,
} from '@shared/services/federal-state-service';
import {
  federalStateFeatureTogglesSchema,
  FederalStateInsertModel,
  FederalStateUpdateModel,
} from '@shared/db/schema';

export async function getFederalStateByIdAction(federalStateId: string) {
  await requireAdminAuth();
  
  // Todo: error handling
  return getFederalStateById(federalStateId);
}

export async function createFederalStateAction(
  data: Omit<FederalStateInsertModel, 'createdAt' | 'featureToggles'>,
) {
  await requireAdminAuth();
  
  // Todo: error handling
  return createFederalState({
    ...data,
    featureToggles: federalStateFeatureTogglesSchema.parse({}),
  });
}

export async function updateFederalStateAction(data: FederalStateUpdateModel) {
  await requireAdminAuth();
  
  // Todo: error handling
  return updateFederalState(data);
}
