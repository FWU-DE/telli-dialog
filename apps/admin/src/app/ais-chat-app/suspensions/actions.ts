'use server';

import { requireAdminAppAccess } from '@/auth/requireAdminAuth';
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
  await requireAdminAppAccess();
  return runServerAction('getSuspensionRequestEntitiesAction', getSuspensionRequestOverviews)();
}

export async function suspendEntityAction(entityRef: EntityRef) {
  await requireAdminAppAccess();
  return runServerAction('suspendEntityAction', suspendEntity)(entityRef);
}

export async function liftSuspensionAction(entityRef: EntityRef) {
  await requireAdminAppAccess();
  return runServerAction('liftSuspensionAction', liftSuspensionOnEntity)(entityRef);
}

export async function markSuspensionRequestAsCheckedAction(suspensionRequestId: string) {
  await requireAdminAppAccess();
  return runServerAction(
    'markSuspensionRequestAsCheckedAction',
    markSuspensionRequestAsChecked,
  )(suspensionRequestId);
}

export async function getSuspensionRequestItemWithDetailsAction({
  entityType,
  entityId,
}: EntityRef) {
  await requireAdminAppAccess();
  return runServerAction(
    'getSuspensionRequestItemWithDetailsAction',
    getSuspensionRequestItemWithDetails,
  )({
    entityType,
    entityId,
  });
}
