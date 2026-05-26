'use server';

import { requireAuth } from '@/auth/requireAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import {
  createSuspensionRequest,
  SuspensionRequestTargetIds,
} from '@shared/suspension/suspension-service';

export async function createSuspensionRequestAction({
  assistantId,
  characterId,
  learningScenarioId,
  reason,
  description,
}: SuspensionRequestTargetIds & {
  reason: string;
  description: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(createSuspensionRequest)({
    assistantId,
    characterId,
    learningScenarioId,
    requesterId: user.id,
    reason,
    description,
  });
}
