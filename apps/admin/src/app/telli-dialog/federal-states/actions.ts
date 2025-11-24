'use server';
import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { getFederalStates } from '@shared/federal-states/federal-state-service';

export async function getFederalStatesAction() {
  await requireAdminAuth();

  return getFederalStates();
}
