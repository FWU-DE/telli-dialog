'use server';
import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { getFederalStates } from '@shared/services/federal-state-service';

export async function getFederalStatesAction() {
  await requireAdminAuth();

  // Todo: error handling
  return getFederalStates();
}
