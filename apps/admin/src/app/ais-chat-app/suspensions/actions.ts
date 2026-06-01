'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import {
  getSuspensionRequestOverviews,
  suspendEntity,
  liftSuspensionOnEntity,
  markSuspensionRequestAsChecked,
  getSuspendedItemWithDetails,
  SuspensionEntityRef,
} from '@shared/suspension/suspension-service';

export async function getSuspendedEntitiesAction() {
  await requireAdminAuth();
  return runServerAction(getSuspensionRequestOverviews)();
}

export async function suspendEntityAction(entityRef: SuspensionEntityRef) {
  await requireAdminAuth();
  return runServerAction(suspendEntity)(entityRef);
}

export async function liftSuspensionAction(entityRef: SuspensionEntityRef) {
  await requireAdminAuth();
  return runServerAction(liftSuspensionOnEntity)(entityRef);
}

export async function markSuspensionRequestAsCheckedAction(suspensionRequestId: string) {
  await requireAdminAuth();
  return runServerAction(markSuspensionRequestAsChecked)(suspensionRequestId);
}

export async function getSuspendedItemWithDetailsAction({
  entityType,
  entityId,
}: SuspensionEntityRef) {
  await requireAdminAuth();
  return runServerAction(getSuspendedItemWithDetails)({
    entityType,
    entityId,
  });
}
