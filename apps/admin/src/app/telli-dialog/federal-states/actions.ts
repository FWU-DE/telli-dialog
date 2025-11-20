'use server';
import { getFederalStates } from '@shared/services/federal-state-service';

export async function getFederalStatesAction() {
  // Todo: Server actions expose a public POST endpoint so we have to check if the user is authorized

  // Todo: error handling
  return getFederalStates();
}
