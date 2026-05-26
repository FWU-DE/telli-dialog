'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import {
  getSuspensionRequestOverviews,
  suspendEntity,
  liftSuspensionOnEntity,
  markSuspensionRequestAsChecked,
} from '@shared/suspension/suspension-service';

export async function getSuspensionsAction() {
  await requireAdminAuth();
  return runServerAction(getSuspensionRequestOverviews)();
}

export async function suspendEntityAction({
  assistantId,
  characterId,
  learningScenarioId,
}: {
  assistantId?: string;
  characterId?: string;
  learningScenarioId?: string;
}) {
  await requireAdminAuth();
  return runServerAction(suspendEntity)({ assistantId, characterId, learningScenarioId });
}

export async function liftSuspensionAction({
  assistantId,
  characterId,
  learningScenarioId,
}: {
  assistantId?: string;
  characterId?: string;
  learningScenarioId?: string;
}) {
  await requireAdminAuth();
  return runServerAction(liftSuspensionOnEntity)({ assistantId, characterId, learningScenarioId });
}

export async function markSuspensionRequestAsCheckedAction(suspensionRequestId: string) {
  await requireAdminAuth();
  return runServerAction(markSuspensionRequestAsChecked)(suspensionRequestId);
}
