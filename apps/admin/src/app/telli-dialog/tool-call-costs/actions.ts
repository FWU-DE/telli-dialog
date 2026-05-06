'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import {
  getToolCallCosts,
  updateToolCallCost,
} from '@shared/tool-call-costs/tool-call-cost-service';
import type { UpdateToolCallCostInput } from '@shared/tool-call-costs/tool-call-cost';

export async function getToolCallCostsAction() {
  await requireAdminAuth();

  return getToolCallCosts();
}

export async function updateToolCallCostAction(input: UpdateToolCallCostInput) {
  await requireAdminAuth();

  return updateToolCallCost(input);
}
