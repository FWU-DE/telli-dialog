'use server';
import { 
  getFederalStateById, 
  createFederalState,
  updateFederalState
} from '@shared/services/federal-state-service';
import { federalStateFeatureTogglesSchema, FederalStateInsertModel } from '@shared/db/schema';

export async function getFederalStateByIdAction(federalStateId: string) {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  // Todo: error handling
  return getFederalStateById(federalStateId);
}

export async function createFederalStateAction(data: Omit<FederalStateInsertModel, 'createdAt' | 'featureToggles'>) {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  // Todo: error handling
  return createFederalState({...data, featureToggles: federalStateFeatureTogglesSchema.parse({})});
}

export async function updateFederalStateAction(data: FederalStateInsertModel) {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  // Todo: error handling
  return updateFederalState(data);
}