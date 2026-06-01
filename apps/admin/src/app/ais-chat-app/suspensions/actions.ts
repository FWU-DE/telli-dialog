'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import {
  getSuspensionRequestOverviews,
  suspendEntity,
  liftSuspensionOnEntity,
  markSuspensionRequestAsChecked,
  getSuspendedItemWithDetails,
} from '@shared/suspension/suspension-service';
import { EntityRef } from '@shared/entities/entity-types';

export async function getSuspendedEntitiesAction() {
  await requireAdminAuth();
  return runServerAction(getSuspensionRequestOverviews)();
}

export async function suspendEntityAction(entityRef: EntityRef) {
  await requireAdminAuth();
  return runServerAction(suspendEntity)(entityRef);
}

export async function liftSuspensionAction(entityRef: EntityRef) {
  await requireAdminAuth();
  return runServerAction(liftSuspensionOnEntity)(entityRef);
}

export async function markSuspensionRequestAsCheckedAction(suspensionRequestId: string) {
  await requireAdminAuth();
  return runServerAction(markSuspensionRequestAsChecked)(suspensionRequestId);
}

export async function getSuspendedItemWithDetailsAction({ entityType, entityId }: EntityRef) {
  await requireAdminAuth();
  return runServerAction(getSuspendedItemWithDetails)({
    entityType,
    entityId,
  });
}
