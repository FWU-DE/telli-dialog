'use server';

import { requireAdminAuth } from '@/auth/requireAdminAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import {
  getSuspensionRequestOverviews,
  suspendEntity,
  liftSuspensionOnEntity,
  markSuspensionRequestAsChecked,
  getSuspensionRequestItemWithDetails,
} from '@shared/suspension/suspension-service';
import { EntityRef } from '@shared/entities/entity-types';

export async function getSuspensionRequestEntitiesAction() {
  await requireAdminAuth();
  return runServerAction('getSuspensionRequestEntitiesAction', getSuspensionRequestOverviews)();
}

export async function suspendEntityAction(entityRef: EntityRef) {
  await requireAdminAuth();
  return runServerAction('suspendEntityAction', suspendEntity)(entityRef);
}

export async function liftSuspensionAction(entityRef: EntityRef) {
  await requireAdminAuth();
  return runServerAction('liftSuspensionAction', liftSuspensionOnEntity)(entityRef);
}

export async function markSuspensionRequestAsCheckedAction(suspensionRequestId: string) {
  await requireAdminAuth();
  return runServerAction(
    'markSuspensionRequestAsCheckedAction',
    markSuspensionRequestAsChecked,
  )(suspensionRequestId);
}

export async function getSuspensionRequestItemWithDetailsAction({
  entityType,
  entityId,
}: EntityRef) {
  await requireAdminAuth();
  return runServerAction(
    'getSuspensionRequestItemWithDetailsAction',
    getSuspensionRequestItemWithDetails,
  )({
    entityType,
    entityId,
  });
}
